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
        if (data.data && Array.isArray(data)) {
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

    /** @todo */
    async create(options) {}

    /** @todo */
    async update(id, options) {}

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
