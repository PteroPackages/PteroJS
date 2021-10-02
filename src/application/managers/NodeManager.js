const Node = require('../../structures/Node');
const Dict = require('../../structures/Dict');
const endpoints = require('./endpoints');

class NodeManager {
    constructor(client) {
        this.client = client;

        /** @type {Dict<number, Node>} */
        this.cache = new Dict();
    }

    _patch(data) {
        if (data.data) {
            const res = new Dict();
            for (const o of data.data) {
                const n = new Node(this.client, o);
                res.set(n.id, n);
            }
            if (this.client.options.cacheNodes) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }
        const n = new Node(this.client, data);
        if (this.client.options.cacheNodes) this.cache.set(n.id, n);
        return n;
    }

    /**
     * Fetches a node from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the node.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional data to include about the node.
     * @returns {Promise<Node|Dict<number, Node>>} The fetched node(s).
     */
    async fetch(id, options = {}) {
        if (id) {
            if (!options.force) {
                const n = this.cache.get(id);
                if (n) return Promise.resolve(n);
            }
            const data = await this.client.requests.make(
                endpoints.nodes.get(id) + joinParams(options.include)
            );
            return this._patch(data);
        }
        const data = await this.client.requests.make(
            endpoints.nodes.main + joinParams(options.include)
        );
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
     * @param {number} options.sftp.port The port for the SFTP.
     * @param {number} options.sftp.listener The listener port for the SFTP.
     * @param {number} [options.upload_size] The maximum upload size for the node.
     * @param {number} [options.memory_overallocate] The amount of memory over allocation.
     * @param {number} [options.disk_overallocate] The amount of disk over allocation.
     * @returns {Promise<Node>} The new node.
     */
    async create(options = {}) {
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

        const payload = {};
        payload.name = options.name;
        payload.location = options.location;
        payload.fqdn = options.fqdn;
        payload.scheme = options.scheme;
        payload.memory = options.memory;
        payload.disk = options.disk;
        payload.sftp = options.sftp;
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
     * @param {object} options Node update options.
     * @param {string} [options.name] The name of the node.
     * @param {number} [options.location] The ID of the location for the node.
     * @param {string} [options.fqdn] The FQDN for the node.
     * @param {string} [options.scheme] The HTTP/HTTPS scheme for the node.
     * @param {number} [options.memory] The amount of memory for the node.
     * @param {number} [options.disk] The amount of disk for the node.
     * @param {object} [options.sftp] SFTP options.
     * @param {number} [options.sftp.port] The port for the SFTP.
     * @param {number} [options.sftp.listener] The listener port for the SFTP.
     * @param {number} [options.upload_size] The maximum upload size for the node.
     * @param {number} [options.memory_overallocate] The amount of memory over allocation.
     * @param {number} [options.disk_overallocate] The amount of disk over allocation.
     * @returns {Promise<Node>} The updated node instance.
     */
    async update(node, options = {}) {
        if (typeof node === 'number') node = await this.fetch(node);
        if (!Object.keys(options).length) throw new Error('Too few options to update.');

        const { id } = node;
        const payload = {};
        Object.entries(node.toJSON()).forEach(e => payload[e[0]] = options[e[0]] ?? e[1]);
        payload.memory_overallocate = payload.overallocated_memory;
        payload.disk_overallocate = payload.overallocated_disk;

        const data = await this.client.requests.make(
            endpoints.nodes.get(id), payload, 'PATCH'
        );
        return this._patch(data);
    }

    /**
     * Deletes a node from Pterodactyl.
     * @param {number|Node} node The node to delete.
     * @returns {Promise<boolean>}
     */
    async delete(node) {
        if (node instanceof Node) node = node.id;
        await this.client.requests.make(endpoints.nodes.get(node), null, 'DELETE');
        this.cache.delete(node);
        return true;
    }
}

module.exports = NodeManager;

function joinParams(params) {
    if (!params || !params.length) return '';
    params = params.filter(p => ['allocations', 'location', 'servers'].includes(p));
    return '?include='+ params.toString();
}
