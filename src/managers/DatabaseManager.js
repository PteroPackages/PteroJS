const endpoints = require('../client/managers/endpoints');

class DatabaseManager {
    constructor(client, server, data) {
        this.client = client;
        this.server = server;

        /**
         * Whether the client using this manager is the PteroClient or PteroApp.
         * @type {boolean}
         */
        this.isClient = client.constructor.name === 'PteroClient';

        /** @type {Map<string, Database>} */
        this.cache = new Map();
        this._patch(data);
    }

    _patch(data) {
        if (!data.databases && !data.data && !data.attributes) return;
        if (data.databases) data = data.databases.data;
        if (data.data) {
            const res = new Map();
            for (let db of data.data) {
                db = db.attributes;
                res.set(db.id, {
                    id: db.id,
                    host: db.host,
                    name: db.name,
                    username: db.username,
                    password: db.password ?? null,
                    connections: db.connections,
                    maxConnections: db.max_connections
                });
            }
            res.forEach((v, k) => this.cache.set(k, v));
            return res;
        } else {
            data = data.attributes;
            const o = {
                id: data.id,
                host: data.host,
                name: data.name,
                username: data.username,
                password: data.password ?? null,
                connections: data.connections,
                maxConnections: data.max_connections
            }
            this.cache.set(data.id, o);
            return o;
        }
    }

    async fetch(withPass = false) {
        if (!this.isClient) return Promise.resolve();
        const data = await this.client.requests.make(
            endpoints.servers.databases.main(this.server.identifier) + (withPass ? '?include=password' : '')
        );
        return this._patch(data);
    }

    async create(database, remote) {
        if (!this.isClient) return Promise.resolve();
        const data = await this.client.requests.make(
            endpoints.servers.databases.get(this.server.identifier),
            { database, remote }, 'POST'
        );
        return this._patch(data);
    }

    async rotate(id) {
        if (!this.isClient) return Promise.resolve();
        const data = await this.client.requests.make(
            endpoints.servers.databases.rotate(this.server.identifier, id), { method: 'POST' }
        );
        return this._patch(data);
    }

    async delete(id) {
        if (!this.isClient) return Promise.resolve();
        await this.client.requests.make(
            endpoints.servers.databases.delete(this.server.identifier, id), { method: 'DELETE' }
        );
        this.cache.delete(id);
        return true;
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
