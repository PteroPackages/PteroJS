class AllocationManager {
    constructor(data) {
        /**
         * @type {Set<Allocation>}
         */
        this.cache = new Set();
        this._patch(data);
    }

    _patch(data) {
        if (!data) return;
        for (let o of data.relationships.allocations.data) {
            o = o.attributes;
            this.cache.add({
                id: o.id,
                ip: o.ip,
                ipAlias: o.ip_alias ?? null,
                port: o.port,
                notes: o.notes || null,
                isDefault: o.is_default
            });
        }
    }

    async fetch() {}

    async assign() {}

    async setNote(id, note) {}

    async setPrimary(id) {}

    async unassign(id) {}
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
