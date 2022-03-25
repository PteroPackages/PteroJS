const Dict = require('../structures/Dict');
const Node = require('../structures/Node');
const build = require('../util/query');
const endpoints = require('./endpoints');

class NodeAllocationManager {
    static get INCLUDES() {
        return Object.freeze(['node', 'server']);
    }

    constructor(client) {
        this.client = client;
        this.cache = new Dict();
    }

    _patch(node, data) {
        const res = new Dict();
        for (let o of data.data) {
            o = o.attributes;
            res.set(o.id, {
                id: o.id,
                ip: o.ip,
                alias: o.alias,
                port: o.port,
                notes: o.notes ?? null,
                assigned: o.assigned
            });
        }

        const allocs = this.cache.get(node) ?? new Dict();
        res.forEach((v, k) => allocs.set(k, v));
        this.cache.set(node, allocs);
        return res;
    }

    /**
     * Returns a formatted URL to the node allocations in the admin panel.
     * @param {number} id The ID of the node.
     * @returns {string} The formatted URL.
     */
    adminURLFor(id) {
        return `${this.client.domain}/admin/nodes/view/${id}/allocation`;
    }

    /**
     * Fetches node allocations from the Pterodactyl API with an optional cache check.
     * @param {number} node The ID of the node for the allocations
     * @param {object} options Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional fetch parameters to include.
     * @returns {Promise<Dict<number, NodeAllocation>>} The fetched node allocations.
     */
    async fetch(node, options = {}) {
        if (!options.force) {
            const a = this.cache.get(node);
            if (a) return Promise.resolve(a);
        }

        const query = build(options, { include: NodeAllocationManager.INCLUDES });
        const data = await this.client.requests.get(
            endpoints.nodes.allocations.main(node) + query
        );
        return this._patch(node, data);
    }

    /**
     * Fetches the available allocations for a node (ones not assigned to servers).
     * @param {number} node The ID of the node.
     * @param {boolean} single Whether to return a single node allocation.
     * @returns {Promise<Dict<string, NodeAllocation>|NodeAllocation|void>}
     */
    async fetchAvailable(node, single = true) {
        const allocs = await this.fetch(node, { include:['server'] });
        return single
            ? allocs.filter(a => !a.assigned).first()
            : allocs.filter(a => !a.assigned);
    }

    /**
     * Creates a new allocation for a specified node.
     * @param {number} node The ID of the node to create the allocation on.
     * @param {number} ip The IP address for the allocation.
     * @param {string[]} ports An array of ports to assign to the allocation.
     * @returns {Promise<void>}
     */
    async create(node, ip, ports = []) {
        if (!ports.every(p => typeof p === 'string'))
            throw new TypeError('Allocation ports must be a string integer or string range.');

        for (const port of ports) {
            if (!port.includes('-')) continue;
            let [start, stop] = port.split('-');
            start = Number(start), stop = Number(stop);

            if (start > stop) throw new RangeError('Start cannot be greater than stop.');
            if (start <= 1024 || stop > 65535)
                throw new RangeError('Port range must be between 1024 and 65535.');

            if (stop - start > 1000) throw new RangeError('Maximum port range exceeded (1000).');
        }

        await this.client.requests.post(
            endpoints.nodes.allocations.main(node),
            { ip, ports }
        );
    }

    /**
     * Deletes an existing allocation from a specified node.
     * @param {number} node The ID of the node
     * @param {number} id The ID of the allocation to delete.
     * @returns {Promise<boolean>}
     */
    async delete(node, id) {
        await this.client.requests.delete(
            endpoints.nodes.allocations.get(node, id)
        );
        this.cache.get(node)?.delete(id);
        return true;
    }
}

module.exports = NodeAllocationManager;

/**
 * Represents a node allocation for a server.
 * @typedef {object} NodeAllocation
 * @property {number} id The ID of the allocation.
 * @property {string} ip The IP of the allocation.
 * @property {?string} alias An alias for the IP.
 * @property {number} port The port for the allocation.
 * @property {?string} notes Additional notes for the allocation.
 * @property {boolean} assigned Whether it is a default allocation.
 */
