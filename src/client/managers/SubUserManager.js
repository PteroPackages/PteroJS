const { PteroSubUser } = require('../../structures/User');
const Permissions = require('../../structures/Permissions');
const { PermissionResolvable } = require('../../structures/Permissions');
const Dict = require('../../structures/Dict');
const endpoints = require('./endpoints');

class SubUserManager {
    constructor(client, server) {
        this.client = client;
        this.server = server;

        /** @type {Dict<string, PteroSubUser>} */
        this.cache = new Dict();
    }

    _patch(data) {
        if (data.data) {
            const s = new Dict();
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
     * Resolves a subuser from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * Returns `null` if not found.
     * @param {string|number|object|PteroSubUser} obj The object to resolve from.
     * @returns {?PteroSubUser} The resolved subuser.
     */
    resolve(obj) {
        if (obj instanceof PteroSubUser) return obj;
        if (typeof obj === 'number') return this.cache.get(obj) || null;
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj) || null;
        if (obj.relationships?.user) return this._patch(obj.relationships.user);
        return null;
    }

    /**
     * Fetches a server subuser from the Pterodactyl API with an optional cache check.
     * @param {string} [id] The UUID of the user.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<PteroSubUser|Dict<string, PteroSubUser>>} The fetched user(s).
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const u = this.cache.get(id);
                if (u) return Promise.resolve(u);
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
     * @param {string} email The email of the associated account.
     * @param {PermissionResolvable} permissions Permissions for the account.
     */
    async add(email, permissions) {
        if (typeof email !== 'string') throw new Error('Email must be a string.');
        const perms = new Permissions(permissions).toStrings();
        if (!perms.length) throw new Error('Need at least 1 permission for the subuser.');
        const data = await this.client.requests.make(
            endpoints.servers.users.main(this.server.identifier),
            { email, permissions: perms }, 'POST'
        );
        return this._patch(data);
    }

    /**
     * Updates the specified subuser's server permissions.
     * @param {string} uuid The UUID of the subuser.
     * @param {PermissionResolvable} permissions Permissions for the subuser.
     */
    async setPermissions(uuid, permissions) {
        const perms = new Permissions(permissions).toStrings();
        if (!perms.length) throw new Error('Need at least 1 permission for the subuser.');
        const data = await this.client.requests.make(
            endpoints.servers.users.get(this.server.identifier, uuid),
            { permissions: perms }, 'POST'
        );
        return this._patch(data);
    }

    /**
     * Removes the specified subuser from the server.
     * @param {string} id The UUID of the subuser.
     * @returns {Promise<boolean>}
     */
    async remove(id) {
        await this.client.requests.make(
            endpoints.servers.users.get(this.server.identifier, id), { method: 'DELETE' }
        );
        this.cache.delete(id);
        return true;
    }
}

module.exports = SubUserManager;
