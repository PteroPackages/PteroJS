const endpoints = require('../application/managers/Endpoints');

class Node {
    constructor(client, data) {
        this.client = client;
        data = data.attributes;

        /**
         * @type {number}
         */
        this.id = data.id;

        /**
         * @type {string}
         */
        this.uuid = data.uuid;

        /**
         * @type {boolean}
         */
        this.public = data.public;

        /**
         * @type {string}
         */
        this.name = data.name;

        /**
         * @type {?string}
         */
        this.description = data.description || null;

        /**
         * @type {number}
         */
        this.location = data.location_id;

        /**
         * @type {string}
         */
        this.fqdn = data.fqdn;

        /**
         * @type {string}
         */
        this.scheme = data.scheme;

        /**
         * @type {boolean}
         */
        this.behindProxy = data.behind_proxy;

        /**
         * @type {boolean}
         */
        this.maintenance = data.maintenance_mode;

        /**
         * @type {number}
         */
        this.memory = data.memory;

        /**
         * @type {number}
         */
        this.overallocatedMemory = data.memory_overallocate;

        /**
         * @type {number}
         */
        this.overallocatedDisk = data.disk_overallocate;

        /**
         * @type {number}
         */
        this.uploadSize = data.upload_size;

        /**
         * @type {object}
         */
        this.daemon = {
            /**
             * @type {number}
             */
            listening: data.daemon_listen,

            /**
             * @type {number}
             */
            sftp: data.daemon_sftp,

            /**
             * @type {string}
             */
            base: data.daemon_base
        }

        /**
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
    }

    /**
     * Returns the node's config (untyped).
     * @returns {Promise<object>}
     */
    async getConfig() {
        return await this.client.requests.make(endpoints.nodes.config(this.id));
    }

    /**
     * Updates the node with the specified options.
     * @param {object} options Node update options.
     * @param {string} [options.name] The name of the node.
     * @param {number} [options.location] The ID of the location for the node.
     * @param {string} [options.fqdn] The FQDN for the node.
     * @param {string} [options.scheme] The HTTP/HTTPS scheme for the node.
     * @param {number} [options.memory] The amount of memory for the node.
     * @param {number} [options.disk] The amount of disk for the node.
     * @param {object} [options.sftp] SFTP options.
     * @param {number} [options.sftp.port] The port for the SFPT.
     * @param {number} [options.sftp.listener] The listener port for the SFPT.
     * @param {number} [options.upload_size] The maximum upload size for the node.
     * @param {number} [options.memory_overallocate] The amount of memory over allocation.
     * @param {number} [options.disk_overallocate] The amount of disk over allocation.
     * @returns {Promise<Node>}
     */
    async update(options = {}) {
        return this.client.nodes.update(this, options);
    }

    /**
     * Deletes the node from Pterodactyl.
     * **WARNING:** This is an irreversable action and requires all servers to be removed
     * from the node before deleting.
     * @returns {Promise<boolean>}
     */
    async delete() {
        await this.client.requests.make(endpoints.nodes.get(this.id), { method: 'DELETE' });
        this.client.nodes.cache.delete(this.id);
        return true;
    }

    /**
     * Returns the JSON value of the Node.
     * @returns {object}
     */
    toJSON() {
        return JSON.parse(JSON.stringify(this));
    }
}

module.exports = Node;
