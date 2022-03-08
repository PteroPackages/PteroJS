const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class BackupManager {
    constructor(client, server) {
        this.client = client;
        this.server = server;

        /** @type {Dict<string, Backup>} */
        this.cache = new Dict();
    }

    _patch(data) {
        if (data.data) {
            const s = new Dict();
            for (let o of data.data) {
                o = o.attributes;
                this.cache.set(o.uuid, {
                    uuid: o.uuid,
                    name: o.name,
                    ignoredFiles: o.ignored_files,
                    hash: o.hash,
                    bytes: o.bytes,
                    createdAt: new Date(o.created_at),
                    completedAt: o.completed_at ? new Date(o.completed_at) : null
                });
                s.set(o.uuid, this.cache.get(o.uuid));
            }
            return s;
        }
        data = data.attributes;
        this.cache.set(data.uuid, {
            uuid: data.uuid,
            name: data.name,
            ignoredFiles: data.ignored_files,
            hash: data.hash,
            bytes: data.bytes,
            createdAt: new Date(data.created_at),
            completedAt: data.completed_at ? new Date(data.completed_at) : null
        });
        return this.cache.get(data.uuid);
    }

    /**
     * Fetches a backup from the Pterodactyl API with an optional cache check.
     * @param {string} [id] The UUID of the backup.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<Backup|Dict<string, Backup>>} The fetched backup(s).
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const b = this.cache.get(id);
                if (b) return Promise.resolve(b);
            }
            const data = await this.client.requests.get(
                endpoints.servers.backups.get(this.server.identifier, id)
            );
            return this._patch(data);
        }
        const data = await this.client.requests.get(
            endpoints.servers.backups.main(this.server.identifier)
        );
        return this._patch(data);
    }

    /**
     * Creates a new backup.
     * @returns {Promise<Backup>} The new backup object.
     */
    async create() {
        return this._patch(
            await this.client.requests.post(
                endpoints.servers.backups.main(this.server.identifier),
                {}
            )
        );
    }

    /**
     * Returns a download link for the backup.
     * @param {string} id The UUID of the backup.
     * @returns {Promise<string>} The download link.
     */
    async download(id) {
        const url = await this.client.requests.get(
            endpoints.servers.backups.download(this.server.identifier, id)
        );
        return url.attributes.url;
    }

    /**
     * Deletes a specified backup.
     * @param {string} id The UUID of the backup.
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        await this.client.requests.delete(
            endpoints.servers.backups.get(this.server.identifier, id)
        );
        this.cache.delete(id);
        return true;
    }
}

module.exports = BackupManager;

/**
 * Represents a server backup.
 * @typedef {object} Backup
 * @property {string} uuid The UUID of the backup.
 * @property {string} name The name of the backup.
 * @property {unknown[]} ignoredFiles An array of files ignored by the backup.
 * @property {?string} hash The sha256 hash for the backup.
 * @property {number} bytes The size of the backup in bytes.
 * @property {Date} createdAt The date the backup was created.
 * @property {?Date} completedAt The date the backup was completed.
 */
