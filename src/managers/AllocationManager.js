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
        for (const alloc of data.relationships.allocations.data) {
            this.cache.add({
                id: alloc.id,
                ip: alloc.ip,
                ipAlias: alloc.ip_alias ?? null,
                port: alloc.port,
                notes: alloc.notes || null,
                isDefault: alloc.is_default
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
