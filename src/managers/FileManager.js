const endpoints = require('../client/endpoints');

class FileManager {
    constructor(client, server, data) {
        this.client = client;
        this.server = server;

        /**
         * Whether the client using this manager is the PteroClient or PteroApp.
         * @type {boolean}
         */
        this.isClient = client.constructor.name === 'PteroClient';

        /** @type {Map<string, Map<string, PteroFile>>} */
        this.cache = new Map();
        this.cache.set('/', new Map());
        this._patch(data);
    }

    _patch(data) {
        if (!data?.files && !data?.data && !data?.attributes) return;
        if (data.files) data = data.files.data;
        const dir = decodeURIComponent(data._dir);

        if (data.data) {
            const res = new Map();
            for (let o of data.data) {
                o = o.attributes;
                res.set(o.name, {
                    name: o.name,
                    mode: o.mode,
                    modeBits: BigInt(o.mode_bits ?? -1),
                    size: o.size,
                    isFile: o.is_file,
                    isSymlink: o.is_symlink,
                    isEditable: o.is_editable,
                    mimetype: o.mimetype,
                    createdAt: new Date(o.created_at),
                    modifiedAt: o.modified_at ? new Date(o.modified_at) : null
                });
            }

            let hold = this.cache.get(dir);
            if (!hold) {
                this.cache.set(dir, new Map());
                hold = new Map();
            }

            res.forEach((v, k) => hold.set(k, v));
            this.cache.set(dir, hold);
            return res;
        } else {
            data = data.attributes;
            const o = {
                name: data.name,
                mode: data.mode,
                modeBits: BigInt(data.mode_bits ?? -1),
                size: data.size,
                isFile: data.is_file,
                isSymlink: data.is_symlink,
                isEditable: data.is_editable,
                mimetype: data.mimetype,
                createdAt: new Date(data.created_at),
                modifiedAt: data.modified_at ? new Date(data.modified_at) : null
            }

            let hold = this.cache.get(dir);
            if (!hold) {
                this.cache.set(dir, new Map());
                hold = new Map();
            }

            hold.set(data.name, o);
            this.cache.set(dir, hold);
            return o;
        }
    }

    /**
     * Fetches all files from a specified directory
     * (default is the root folder: `/home/container`).
     * @param {string} [dir] The directory (folder) to fetch from.
     * @returns {Promise<Map<string, PteroFile>>}
     */
    async fetch(dir) {
        if (!this.isClient) return Promise.resolve();
        dir &&= dir.startsWith('.') ? dir.slice(1) : dir;
        dir &&= encodeURIComponent(dir);
        const data = await this.client.requests.get(
            endpoints.servers.files.main(this.server.identifier) + (dir ? `?directory=${dir}` : '')
        );
        data._dir = dir ?? '/';
        return this._patch(data);
    }

    /**
     * Returns the contents of a specified file.
     * @param {string} filePath The path to the file in the server.
     * @returns {Promise<string>}
     */
    async getContents(filePath) {
        if (!this.isClient) return Promise.resolve();
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        filePath = encodeURIComponent(filePath);
        const data = await this.client.requests.get(
            endpoints.servers.files.contents(this.server.identifier, filePath)
        );
        return data.toString();
    }

    /**
     * Returns a URL that can be used to download the specified file.
     * @param {string} filePath The path to the file in the server.
     * @returns {Promise<string>}
     */
    async download(filePath) {
        if (!this.isClient) return Promise.resolve();
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        filePath = encodeURIComponent(filePath);
        const data = await this.client.requests.get(
            endpoints.servers.files.download(this.server.identifier, filePath)
        );
        return data.attributes.url;
    }

    /**
     * Renames the specified file.
     * EXPERIMENTAL: may not be working properly.
     * @param {string} filePath The path to the file in the server.
     * @param {string} name The new name of the file.
     * @returns {Promise<void>}
     */
    async rename(filePath, name) {
        if (!this.isClient) return Promise.resolve();
        filePath ??= '/';
        filePath = filePath.startsWith('.') ? filePath.slice(1) : filePath;
        const sub = filePath.split('/');
        await this.client.requests.put(
            endpoints.servers.files.rename(this.server.identifier),
            {
                root: filePath,
                files:[{
                    from: sub.pop(),
                    to: name
                }]
            }
        );
    }

    /**
     * Creates a copy of the specified file in the same directory.
     * @param {string} filePath The path to the file in the server.
     * @returns {Promise<void>}
     */
    async copy(filePath) {
        if (!this.isClient) return Promise.resolve();
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        await this.client.requests.post(
            endpoints.servers.files.copy(this.server.identifier),
            { location: filePath }
        );
    }

    /**
     * Writes content to the specified file.
     * @param {string} filePath The path to the file in the server.
     * @param {string|Buffer} content The content to write to the file.
     * @returns {Promise<void>}
     */
    async write(filePath, content) {
        if (!this.isClient) return Promise.resolve();
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        filePath = encodeURIComponent(filePath);
        if (content instanceof Buffer) content = content.toString();
        await this.client.requests.post(
            endpoints.servers.files.write(this.server.identifier, filePath),
            { raw: content }
        );
    }

    /**
     * Compresses one or more files into a zip file (`tar.gz`).
     * @param {string} dir The directory (folder) of the file(s).
     * @param {string[]} files An array of the file name(s) to compress.
     * @returns {Promise<PteroFile>} The compressed file.
     */
    async compress(dir, files) {
        if (!this.isClient) return Promise.resolve();
        if (!Array.isArray(files)) throw new TypeError('Files must be an array.');
        if (!files.every(n => typeof n === 'string'))
            throw new Error('File names must be type string.');

        if (dir.startsWith('.')) dir = dir.slice(1);
        const data = await this.client.requests.post(
            endpoints.servers.files.compress(this.server.identifier),
            { root: dir, files }
        );
        return this._patch(data);
    }

    /**
     * Decompresses a zip file to it's original contents.
     * @param {string} dir The directory (folder) of the file.
     * @param {string} file The name of file to decompress.
     * @returns {Promise<void>}
     */
    async decompress(dir, file) {
        if (!this.isClient) return Promise.resolve();
        if (dir.startsWith('.')) dir = dir.slice(1);
        if (file.startsWith('.')) file = file.slice(1);
        await this.client.requests.post(
            endpoints.servers.files.decompress(this.server.identifier),
            { root: dir, file }
        );
    }

    /**
     * Deletes one or more files in the specified directory.
     * @param {string} dir The directory (folder) of the file(s).
     * @param {string[]} files An array of the file name(s) to delete.
     * @returns {Promise<void>}
     */
    async delete(dir, files) {
        if (!this.isClient) return Promise.resolve();
        if (!Array.isArray(files)) throw new TypeError('Files must be an array.');
        if (!files.every(n => typeof n === 'string'))
            throw new Error('File names must be type string.');

        if (dir.startsWith('.')) dir = dir.slice(1);
        await this.client.requests.post(
            endpoints.servers.files.delete(this.server.identifier),
            { root: dir, files }
        );
    }

    /**
     * Creates a new folder in a specified directory.
     * @param {string} dir The directory (folder) to create the folder in.
     * @param {string} name The name of the folder.
     * @returns {Promise<void>}
     */
    async createFolder(dir, name) {
        if (!this.isClient) return Promise.resolve();
        await this.client.requests.post(
            endpoints.servers.files.create(this.server.identifier),
            { root: dir, name }
        );
    }

    /**
     * Returns an upload URL that can be used to upload files to the server.
     * @returns {Promise<string>} The upload URL.
     */
    async getUploadURL() {
        if (!this.isClient) return Promise.resolve();
        const data = await this.client.requests.get(
            endpoints.servers.files.upload(this.server.identifier)
        );
        return data.attributes.url;
    }
}

module.exports = FileManager;

/**
 * Represents a file-like object on a Pterodactyl server.
 * The object can be an instance of a file, directory or symbolic link.
 * * {@link PteroFile.isFile}
 * * {@link PteroFile.isSymlink}
 * @typedef {object} PteroFile
 * @property {string} name The name of the file.
 * @property {string} mode The file permissions mode.
 * @property {bigint} modeBits The bitfield representatio of the mode.
 * @property {number} size The size of the file (bytes).
 * @property {boolean} isFile Whether the object is a file.
 * @property {boolean} isSymlink Whether the file is a symbolic link.
 * @property {boolean} isEditable Whether the file can be edited.
 * @property {string} mimetype The mimetype of the file.
 * @property {Date} createdAt The date when the database was created.
 * @property {?Date} modifiedAt The date of the last recorded modification.
 */
