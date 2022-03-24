const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class ClientDatabaseManager {
    constructor(client, server) {
        this.client = client;
        this.server = server;

        /** @type {Dict<string, ClientDatabase>} */
        this.cache = new Dict();
    }

    _patch(data) {
        const res = new Dict();
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
    }

    async fetch(withPass = false) {
        const data = await this.client.requests.get(
            endpoints.servers.databases.main(this.server.identifier) +
            (withPass ? '?include=password' : '')
        );
        return this._patch(data);
    }

    async create(database, remote) {
        const data = await this.client.requests.post(
            endpoints.servers.databases.get(this.server.identifier),
            { database, remote }
        );
        return this._patch(data);
    }

    async rotate(id) {
        const data = await this.client.requests.post(
            endpoints.servers.databases.rotate(this.server.identifier, id), null
        );
        return this._patch(data);
    }

    async delete(id) {
        await this.client.requests.delete(
            endpoints.servers.databases.delete(this.server.identifier, id)
        );
        this.cache.delete(id);
        return true;
    }
}

module.exports = ClientDatabaseManager;

/**
 * Represents a server database object.
 * @typedef {object} ClientDatabase
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
