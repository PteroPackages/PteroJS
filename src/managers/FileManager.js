const endpoints = require('../client/managers/endpoints');

class FileManager {
    constructor(client, server, data) {
        this.client = client;
        this.server = server;

        /** @type {Map<string, Map<string, PteroFile>>} */
        this.cache = new Map();
        this.cache.set('/', new Map());
        this._patch(data);
    }

    _patch(data) {
        if (!data.files && !data.data && !data.attributes) return;
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

    async fetch(dir) {
        dir &&= dir.startsWith('.') ? dir.slice(1) : dir;
        dir &&= encodeURIComponent(dir);
        const data = await this.client.requests.make(
            endpoints.servers.files.main(this.server.identifier) + (dir ? `?directory=${dir}` : '')
        );
        data._dir = dir ?? '/';
        return this._patch(data);
    }

    async getContents(filePath) {
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        filePath = encodeURIComponent(filePath);
        const data = await this.client.requests.make(
            endpoints.servers.files.contents(this.server.identifier, filePath)
        );
        return data.toString();
    }

    async download(filePath) {
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        filePath = encodeURIComponent(filePath);
        const data = await this.client.requests.make(
            endpoints.servers.files.download(this.server.identifier, filePath)
        );
        return data.attributes.url;
    }

    async rename(filePath, name) {
        filePath ??= '/';
        filePath = filePath.startsWith('.') ? filePath.slice(1) : filePath;
        const sub = filePath.split('/');
        await this.client.requests.make(
            endpoints.servers.files.rename(this.server.identifier),
            {
                root: filePath,
                files:[{
                    from: sub.pop(),
                    to: name
                }]
            },
            'PUT'
        );
    }

    async copy(filePath) {
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        await this.client.requests.make(
            endpoints.servers.files.copy(this.server.identifier),
            { location: filePath }, 'POST'
        );
    }

    async write(filePath, contents) {
        if (filePath.startsWith('.')) filePath = filePath.slice(1);
        filePath = encodeURIComponent(filePath);
        await this.client.requests.make(
            endpoints.servers.files.write(this.server.identifier, filePath),
            { raw: contents }, 'POST'
        );
    }

    async compress(dir, files) {
        if (!Array.isArray(files)) throw new TypeError('Files must be an array.');
        if (!files.every(n => typeof n === 'string')) throw new Error('File names must be type string.');
        if (dir.startsWith('.')) dir = dir.slice(1);
        const data = await this.client.requests.make(
            endpoints.servers.files.compress(this.server.identifier),
            { root: dir, files }, 'POST'
        );
        return this._patch(data);
    }

    async decompress(dir, file) {
        if (dir.startsWith('.')) dir = dir.slice(1);
        if (file.startsWith('.')) file = file.slice(1);
        await this.client.requests.make(
            endpoints.servers.files.decompress(this.server.identifier),
            { root: dir, file }, 'POST'
        );
    }

    async delete(dir, files) {
        if (!Array.isArray(files)) throw new TypeError('Files must be an array.');
        if (!files.every(n => typeof n === 'string')) throw new Error('File names must be type string.');
        if (dir.startsWith('.')) dir = dir.slice(1);
        await this.client.requests.make(
            endpoints.servers.files.delete(this.server.identifier),
            { root: dir, files }, 'POST'
        );
    }

    async createFolder(dir, name) {
        await this.client.requests.make(
            endpoints.servers.files.create(this.server.identifier),
            { root: dir, name }, 'POST'
        );
    }

    async getUploadURL() {
        const data = await this.client.requests.make(
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
