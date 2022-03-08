const { NodeLocation } = require('../application/NodeLocationManager');
const caseConv = require('../util/caseConv');
const endpoints = require('../application/endpoints');

class Node {
    constructor(client, data) {
        this.client = client;
        data = data.attributes;

        /**
         * The date the node was created.
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * The date the node was last updated.
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;

        this._patch(data);
    }

    _patch(data) {
        if ('id' in data) {
            /**
             * The ID of the node.
             * @type {number}
             */
            this.id = data.id;
        }

        if ('uuid' in data) {
            /**
             * The internal UUID of the node.
             * @type {string}
             */
            this.uuid = data.uuid;
        }

        if ('public' in data) {
            /**
             * Whether the node is public to other users.
             * @type {boolean}
             */
            this.public = data.public;
        }

        if ('name' in data) {
            /**
             * The name of the node.
             * @type {string}
             */
            this.name = data.name;
        }

        if ('description' in data) {
            /**
             * A brief description of the node (if set).
             * @type {?string}
             */
            this.description = data.description || null;
        }

        if ('location_id' in data) {
            /**
             * The ID of the node location.
             * @type {number}
             */
            this.locationId = data.location_id;
        }

        if (!this.location) {
            /**
             * The location of the node.
             * @type {?NodeLocation}
             */
            this.location = this.client.locations.resolve(data);
        }

        if (!this.servers) {
            /**
             * A map of servers the node currently contains.
             */
            this.servers = this.client.servers.resolve(data);
        }

        if ('fqdn' in data) {
            /**
             * The FQDN for the node.
             * @type {string}
             */
            this.fqdn = data.fqdn;
        }

        if ('scheme' in data) {
            /**
             * The HTTP scheme for the node.
             * @type {string}
             */
            this.scheme = data.scheme;
        }

        if ('behind_proxy' in data) {
            /**
             * Whether the node is behind a proxy.
             * @type {boolean}
             */
            this.behindProxy = data.behind_proxy;
        }

        if ('maintenance_mode' in data) {
            /**
             * Whether the node is in maintenance mode.
             * @type {boolean}
             */
            this.maintenance = data.maintenance_mode;
        }

        if ('memory' in data) {
            /**
             * The amount of memory the node has.
             * @type {number}
             */
            this.memory = data.memory;
        }

        if ('memory_overallocate' in data) {
            /**
             * The amount of memory the node has overallocated.
             * @type {number}
             */
            this.overallocatedMemory = data.memory_overallocate;
        }

        if ('disk_overallocate' in data) {
            /**
             * The amount of disk the node has overallocated.
             * @type {number}
             */
            this.overallocatedDisk = data.disk_overallocate;
        }

        if ('upload_size' in data) {
            /**
             * The maximum upload size for the node.
             * @type {number}
             */
            this.uploadSize = data.upload_size;
        }

        if ('daeon_listen' in data) {
            /**
             * An object containing Pterodactyl Daemon details.
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
        }
    }

    /**
     * Returns the node's config (untyped).
     * @returns {Promise<object>} The node config.
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
     * @returns {Promise<Node>} The updated node instance.
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
        return this.client.nodes.delete(this.id);
    }

    /**
     * Returns the JSON value of the Node.
     * @returns {object} The JSON value.
     */
    toJSON() {
        return caseConv.snakeCase(this, ['client']);
    }
}

module.exports = Node;
