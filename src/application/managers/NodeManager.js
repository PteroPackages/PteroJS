const { Node } = require('../../structures');
const endpoints = require('./Endpoints');

class NodeManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<number, Node>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const s = new Map();
            for (const o of data.data) {
                const n = new Node(this.client, o);
                this.cache.set(n.id, n);
                s.set(n.id, n);
            }
            return s;
        }
        const n = new Node(this.client, data);
        this.cache.set(n.id, n);
        return n;
    }

    /**
     * Fetches a node from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the node.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<Node|Map<number, Node>>}
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const n = this.cache.get(id);
                if (n) return Promise.resolve(n);
            }
            const data = await this.client.requests.make(endpoints.nodes.get(id));
            return this._patch(data);
        }
        const data = await this.client.requests.make(endpoints.nodes.main);
        return this._patch(data);
    }

    /**
     * Creates a new Pterodactyl server node.
     * @param {object} options Node creation options.
     * @param {string} options.name The name of the node.
     * @param {number} options.location The ID of the location for the node.
     * @param {string} options.fqdn The FQDN for the node.
     * @param {string} options.scheme The HTTP/HTTPS scheme for the node.
     * @param {number} options.memory The amount of memory for the node.
     * @param {number} options.disk The amount of disk for the node.
     * @param {object} options.sftp SFTP options.
     * @param {number} options.sftp.port The port for the SFPT.
     * @param {number} options.sftp.listener The listener port for the SFPT.
     * @param {number} [options.upload_size] The maximum upload size for the node.
     * @param {number} [options.memory_overallocate] The amount of memory over allocation.
     * @param {number} [options.disk_overallocate] The amount of disk over allocation.
     * @returns {Promise<Node>}
     */
    async create(options) {
        if (
            !options.name ||
            !options.location ||
            !options.fqdn ||
            !options.scheme ||
            !options.memory ||
            !options.disk ||
            !options.sftp?.port ||
            !options.sftp?.listener
        ) throw new Error('Missing required Node creation option.');

        const payload = { name, location, fqdn, scheme, memory, disk } = options;
        payload.upload_size = options.upload_size ?? 100;
        payload.memory_overallocate = options.memory_overallocate ?? 0;
        payload.disk_overallocate = options.disk_overallocate ?? 0;

        const data = await this.client.requests.make(
            endpoints.nodes.main, payload, 'POST'
        );
        return this._patch(data);
    }

    /**
     * Updates a specified node.
     * @param {number|Node} node The node to update.
     * @param {object} options Node creation options.
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
    async update(node, options) {
        if (typeof node === 'number') node = this.fetch(node);
        if (!Object.keys(options).length) throw new Error('Too few options to update.');
        const { id } = node;
        const payload = {};
        Object.entries(node.toJSON()).forEach((k, v) => payload[k] = options[k] ?? v);

        const data = await this.client.requests.make(
            endpoints.nodes.get(id), payload, 'PATCH'
        );
        return this._patch(data);
    }

    /**
     * Deletes a node from Pterodactyl.
     * @param {number|Node} node The node to delete.
     * @returns {number}
     */
    async delete(node) {
        if (node instanceof Node) node = node.id;
        await this.client.requests.make(endpoints.nodes.get(node), { method: 'DELETE' });
        this.cache.delete(node);
        return node;
    }
}

module.exports = NodeManager;
