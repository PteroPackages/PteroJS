const endpoints = require('../client/managers/Endpoints');

class FileManager {
    constructor(client, server, data) {
        this.client = client;
        this.server = server;

        /** @type {Map<string, PteroFile>} */
        this.cache = new Map();
        this._patch(data);
    }

    _patch(data) {
        console.log(data);
        if (!data.files || !data.data || !data.attributes) return;
        if (data.files) data = data.files.data;
        if (data.data) {
            for (let o of data.data) {
                o = o.attributes;
                this.cache.set(o.name, {
                    name: o.name,
                    mode: o.mode,
                    size: o.size,
                    isFile: o.is_file,
                    isSymlink: o.is_symlink,
                    isEditable: o.is_editable,
                    mimetype: o.mimetype,
                    createdAt: new Date(o.created_at),
                    modifiedAt: o.modified_at ? new Date(o.modified_at) : null
                });
            }
        } else {
            data = data.attributes;
            this.cache.set(data.name, {
                name: data.name,
                mode: data.mode,
                size: data.size,
                isFile: data.is_file,
                isSymlink: data.is_symlink,
                isEditable: data.is_editable,
                mimetype: data.mimetype,
                createdAt: new Date(data.created_at),
                modifiedAt: data.modified_at ? new Date(data.modified_at) : null
            });
        }
    }

    async #fetch(dir) {
        dir &&= encodeURIComponent(dir);
        console.log(endpoints.servers.files.list(this.server.indentifier));
        const data = await this.client.requests.make(
            endpoints.servers.files.list(this.server.indentifier)
        );
        return this._patch(data);
    }

    async getContents(file) {}

    async getPath(file) {}

    async download(file) {}

    async rename(file, name) {}

    async copy(location) {}

    async write(file, contents) {}

    async compress(file) {}

    async decompress(file) {}

    async delete(file) {}

    async createFolder(path, name) {}

    async getUploadURL() {}
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
 * @property {number} size The size of the file (bytes).
 * @property {boolean} isFile Whether the object is a file.
 * @property {boolean} isSymlink Whether the file is a symbolic link.
 * @property {boolean} isEditable Whether the file can be edited.
 * @property {string} mimetype The mimetype of the file.
 * @property {Date} createdAt The date when the database was created.
 * @property {?Date} modifiedAt The date of the last recorded modification.
 */
