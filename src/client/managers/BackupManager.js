class BackupManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<string, Backup>}
         */
        this.cache = new Map();
    }

    async fetch(id = '', force = false) {}

    async create() {}

    async download(id) {}

    async delete(id) {}
}

module.exports = BackupManager;

/**
 * Represents a server backup.
 * @typedef {object} Backup
 * @property {string} uuid The UUID of the backup.
 * @property {string} name The name of the backup.
 * @property {Array<unknown>} ignoredFiles An array of files ignored by the backup.
 * @property {?string} hash The sha256 hash for the backup.
 * @property {number} bytes The size of the backup in bytes.
 * @property {Date} createdAt The date the backup was created.
 * @property {?Date} completedAt The date the backup was completed.
 */
