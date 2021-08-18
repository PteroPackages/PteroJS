class FileManager {
    constructor(client, data) {
        this.client = client;

        /**
         * @type {Map<string, PteroFile>}
         */
        this.cache = new Map();
        this._patch(data);
    }

    _patch(data) {
        if (data === null) return;
        if (data.data) {
            for (const file of data.data) {
                const attr = file.attributes;
                this.cache.set(attr.name, {
                    name: attr.name,
                    mode: attr.mode,
                    size: attr.size,
                    isFile: attr.is_file,
                    isSymlink: attr.is_symlink,
                    isEditable: attr.is_editable,
                    mimetype: attr.mimetype,
                    createdAt: new Date(attr.created_at),
                    modifiedAt: attr.modified_at ? new Date(attr.modified_at) : null
                });
            }
        } else {
            const attr = data.attributes;
            this.cache.set(attr.name, {
                name: attr.name,
                mode: attr.mode,
                size: attr.size,
                isFile: attr.is_file,
                isSymlink: attr.is_symlink,
                isEditable: attr.is_editable,
                mimetype: attr.mimetype,
                createdAt: new Date(attr.created_at),
                modifiedAt: attr.modified_at ? new Date(attr.modified_at) : null
            });
        }
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
 * @property {number} size The size of the file (bytes).
 * @property {boolean} isFile Whether the object is a file.
 * @property {boolean} isSymlink Whether the file is a symbolic link.
 * @property {boolean} isEditable Whether the file can be edited.
 * @property {string} mimetype The mimetype of the file.
 * @property {Date} createdAt The date when the database was created.
 * @property {?Date} modifiedAt The date of the last recorded modification.
 */
