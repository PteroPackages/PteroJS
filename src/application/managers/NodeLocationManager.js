class NodeLocationManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<number, NodeLocation>}
         */
        this.cache = new Map();
    }

    async fetch(id, force = false) {}

    async create(short, long) {}

    async update(id, { short, long } = {}) {}

    async delete(id) {}
}

module.exports = NodeLocationManager;

/**
 * Represents a location on Pterodactyl.
 * Location objects have little to no methodic usage so they are readonly.
 * @typedef {object} NodeLocation
 * @property {number} id The ID of the location.
 * @property {string} long The long location code.
 * @property {string} short The short location code (or country code).
 * @property {Date} createdAt The date the location was created.
 * @property {?Date} updatedAt The date the location was last updated.
 * @readonly
 */
