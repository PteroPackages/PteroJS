const { PteroUser } = require('../../structures/User');
const endpoints = require('./Endpoints');

class UserManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<number, PteroUser>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const res = new Map();
            for (let o of data.data) {
                o = o.attributes;
                const u = new PteroUser(this.client, o);
                res.set(u.id, u);
            }
            if (this.client.options.cacheUsers) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }
        const u = new PteroUser(this.client, data.attributes);
        if (this.client.options.cacheUsers) this.cache.set(u.id, u);
        return u;
    }

    /**
     * Fetches a user from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the user.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<PteroUser|Map<number, PteroUser>>}
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const u = this.cache.get(id);
                if (u) return Promise.resolve(u);
            }
            const data = await this.client.requests.make(endpoints.users.get(id));
            return this._patch(data);
        }
        const data = await this.client.requests.make(endpoints.users.main);
        return this._patch(data);
    }

    /**
     * Fetches a user by their external ID with an optional cache check.
     * @param {number} id The ID of the external user.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {boolean} [options.withServers] Whether to include servers the user has.
     * @returns {Promise<PteroUser>}
     */
    async fetchExternal(id, options = {}) {
        if (!options.force) for (const [, user] of this.cache) if (id === user.externalId) return user;
        const data = await this.client.requests.make(
            endpoints.users.ext(id) + (options.withServers ? '?include=servers' : '')
        );
        return this._patch(data);
    }

    /**
     * Creates a new Pterodactyl user account.
     * @param {string} email The email for the account.
     * @param {string} username The username for the acount.
     * @param {string} firstname The firstname for the account.
     * @param {string} lastname The lastname for the account.
     * @returns {Promise<PteroUser>}
     */
    async create(email, username, firstname, lastname) {
        const data = await this.client.requests.make(
            endpoints.users.main,
            { email, username, first_name: firstname, last_name: lastname },
            'POST'
        );
        return this._patch(data);
    }

    /**
     * Updates the specified user's account.
     * @param {number|PteroUser} user The user to update.
     * @param {object} options Changes to update the user with.
     * @param {string} [options.email] The new email for the account.
     * @param {string} [options.username] The new username for the account.
     * @param {string} [options.firstname] The new firstname for the account.
     * @param {string} [options.lastname] The new lastname for the account.
     * @param {string} [options.language] The new language for the account.
     * @param {string} options.password The password for the user account.
     * @returns {Promise<PteroUser>}
     */
    async update(user, options = {}) {
        if (!options.password) throw new Error('User password is required.');
        if (
            !options.email &&
            !options.username &&
            !options.firstname &&
            !options.lastname &&
            !options.language
        ) throw new Error('Too few parameters to update.');
        if (typeof user === 'number') user = await this.fetch(user);

        const { password } = options;
        let { id, email, username, firstname, lastname, language } = user;
        if (options.email) email = options.email;
        if (options.username) username = options.username;
        if (options.firstname) firstname = options.firstname;
        if (options.lastname) lastname = options.lastname;
        if (options.language) language = options.language;

        const data = await this.client.requests.make(
            endpoints.users.get(id),
            { email, username, first_name: firstname, last_name: lastname, language, password },
            'PATCH'
        );
        return this._patch(data);
    }

    /**
     * Deletes the user account from Pterodactyl.
     * @param {number|PteroUser} user The user to delete.
     * @returns {Promise<boolean>}
     */
    async delete(user) {
        if (user instanceof PteroUser) user = user.id;
        await this.client.requests.make(endpoints.users.get(user), { method: 'DELETE' });
        this.cache.delete(user);
        return true;
    }
}

module.exports = UserManager;
