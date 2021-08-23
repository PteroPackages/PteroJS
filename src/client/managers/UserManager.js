const { PteroSubUser } = require('../../structures/User');
const Permissions = require('../../structures/Permissions');
const endpoints = require('./Endpoints');

class UserManager {
    constructor(client, server) {
        this.client = client;
        this.server = server;

        /**
         * @type {Map<string, PteroSubUser>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const s = new Map();
            for (const o of data.data) {
                const u = new PteroSubUser(this.client, o);
                this.cache.set(u.id, u);
                s.set(u.id, u);
            }
            return s;
        }
        const u = new PteroSubUser(this.client, data);
        this.cache.set(u.id, u);
        return u;
    }

    /**
     * Fetches a server subuser from the Pterodactyl API with an optional cache check.
     * @param {string} id The UUID of the user.
     * @param {boolean} force Whether to skip checking the cache and fetch directly.
     * @returns {Promise<PteroSubUser|Map<string, PteroSubUser>>}
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const u = this.cache.get(id);
                if (u) return u;
            }
            const data = await this.client.requests.make(
                endpoints.servers.users.get(this.server.identifier, id)
            );
            return this._patch(data);
        }
        const data = await this.client.requests.make(
            endpoints.servers.users.main(this.server.identifier)
        );
        return this._patch(data);
    }

    /**
     * Adds a specified user to the server.
     * @todo Requires {@link Permissions} class completion.
     * @todo Add resolvable PteroUser support.
     * @param {string} email The email of the associated account.
     * @param {Permissions} permissions Permissions for the account.
     */
    async add(email, permissions) {}

    /**
     * Updates the specified subuser's server permissions.
     * @todo Requires {@link Permissions} class completion.
     * @todo Add resolvable PteroUser support.
     * @param {string} user The UUID of the user.
     * @param {Permissions} permissions Permissions for the subuser.
     */
    async setPermissions(user, permissions) {}

    /**
     * Removes the specified subuser from the server.
     * @param {string} id The UUID of the subuser.
     * @returns {Promise<string>}
     */
    async remove(id) {
        await this.client.requests.make(
            endpoints.servers.users.get(this.server.identifier, id), { method: 'DELETE' }
        );
        this.cache.delete(id);
        return id;
    }
}

module.exports = UserManager;
