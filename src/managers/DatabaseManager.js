class DatabaseManager {
    constructor(client, data) {
        this.client = client;

        /**
         * @type {Set<Database>}
         */
        this.cache = new Set();
        this._patch(data);
    }

    _patch(data) {
        if (!data) return;
        if (data.data) {
            for (let db of data.data) {
                db = db.attributes;
                this.cache.add({
                    id: db.id,
                    host: db.host,
                    name: db.name,
                    username: db.username,
                    password: db.password ?? null,
                    connections: db.connections,
                    maxConnections: db.max_connections
                });
            }
        } else {
            data = data.attributes;
            this.cache.add({
                id: data.id,
                host: data.host,
                name: data.name,
                username: data.username,
                password: data.password ?? null,
                connections: data.connections,
                maxConnections: data.max_connections
            });
        }
    }
}

module.exports = DatabaseManager;

/**
 * Represents a server database object.
 * @typedef {object} Database
 * @property {string} id The ID of the database.
 * @property {object} host Host information for the database.
 * @property {string} host.address The address of the database.
 * @property {number} host.port The port allocated to this database.
 * @property {string} name The name of the database.
 * @property {string} username The username for the database.
 * @property {?string} password The password for this database.
 * @property {string} connections Connections to the database.
 * @property {number} maxConnections The max amount of connections allowed for this database.
 */
