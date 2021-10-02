const endpoints = require('../client/managers/endpoints');

class AllocationManager {
    constructor(client, server, data) {
        this.client = client;
        this.server = server;

        /**
         * Whether the client using this manager is the PteroClient or PteroApp.
         * @type {boolean}
         */
        this.isClient = client.constructor.name === 'PteroClient';

        /** @type {Set<Allocation>} */
        this.cache = new Set();
        this._patch(data);
    }

    _patch(data) {
        if (!data?.allocations && !data?.data && !data?.attributes) return;
        if (data.allocations) data = data.allocations;
        if (data.data) {
            const res = new Set();
            for (let o of data.data) {
                o = o.attributes;
                res.add({
                    id: o.id,
                    ip: o.ip,
                    ipAlias: o.ip_alias,
                    port: o.port,
                    notes: o.notes ?? null,
                    isDefault: o.is_default
                });
            }
            res.forEach(a => this.cache.add(a));
            return res;
        } else {
            data = data.attributes;
            const o = {
                id: data.id,
                ip: data.ip,
                ipAlias: data.ip_alias,
                port: data.port,
                notes: data.notes ?? null,
                isDefault: data.is_default
            }
            this.cache.add(o);
            return o;
        }
    }

    async fetch() {
        return this._patch(
            await this.client.requests.make(
                endpoints.servers.network.main(this.server.identifier)
            )
        );
    }

    async assign() {
        return this._patch(
            await this.client.requests.make(
                endpoints.servers.network.main(this.server.identifier), null, 'POST'
            )
        );
    }

    async setNote(id, note) {
        const data = await this.client.requests.make(
            endpoints.servers.network.get(this.server.identifier, id),
            { notes: note }, 'POST'
        );
        return this._patch(data);
    }

    async setPrimary(id) {
        return this._patch(
            await this.client.requests.make(
                endpoints.servers.network.primary(this.server.identifier, id), null, 'POST'
            )
        );
    }

    async unassign(id) {
        await this.client.requests.make(
            endpoints.servers.network.get(this.server.identifier, id), null, 'DELETE'
        );
        const res = this.cache;
        this.cache.forEach(a => { if (a.id !== id) res.add(a) });
        this.cache = a;
    }
}

module.exports = AllocationManager;

/**
 * Represents an allocation for a server.
 * @typedef {object} Allocation
 * @property {number} id The ID of the allocation.
 * @property {string} ip The IP of the allocation.
 * @property {?string} ipAlias An alias for the IP.
 * @property {number} port The port for the allocation.
 * @property {?string} notes Additional notes for the allocation.
 * @property {boolean} isDefault Whether it is a default allocation.
 */
