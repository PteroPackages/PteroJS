const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class NetworkAllocationManager {
    constructor(client, server) {
        this.client = client;
        this.server = server;

        /** @type {Dict<number, NetworkAllocation>} */
        this.cache = new Dict();
    }

    _patch(data) {
        const res = new Dict();
        for (let o of data.data) {
            o = o.attributes;
            res.set(o.id, {
                id: o.id,
                ip: o.ip,
                ipAlias: o.ip_alias,
                port: o.port,
                notes: o.notes || null,
                isDefault: o.is_default
            });
        }

        res.forEach((v, k) => this.cache.set(k, v));
        return res;
    }

    async fetch() {
        const data = await this.client.requests.get(
            endpoints.servers.network.main(this.server.identifier)
        );
        return this._patch(data);
    }

    async assign() {
        const data = await this.client.requests.post(
            endpoints.servers.network.main(this.server.identifier), null
        );
        return this._patch(data);
    }

    async setNote(id, notes) {
        const data = await this.client.requests.post(
            endpoints.servers.network.get(this.server.identifier, id),
            { notes }
        );
        return this._patch(data);
    }

    async setPrimary(id) {
        const data = await this.client.requests.post(
            endpoints.servers.network.primary(this.server.identifier, id), null
        );
        return this._patch(data);
    }

    async unassign(id) {
        await this.client.requests.delete(
            endpoints.servers.network.get(this.server.identifier, id)
        );
        this.cache.delete(id);
        return true;
    }
}

module.exports = NetworkAllocationManager;

/**
 * Represents a network allocation for a server.
 * @typedef {object} NetworkAllocation
 * @property {number} id The ID of the allocation.
 * @property {string} ip The IP of the allocation.
 * @property {?string} ipAlias An alias for the IP.
 * @property {number} port The port for the allocation.
 * @property {?string} notes Additional notes for the allocation.
 * @property {boolean} isDefault Whether it is a default allocation.
 */
