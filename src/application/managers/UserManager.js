const { PteroUser } = require('../../structures');
const endpoints = require('./Endpoints');

class UserManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<number, PteroUser>}
         */
        this.cache = new Map();
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
            let user = await this.client.requests.make(endpoints.users.get(id));
            user = new PteroUser(this.client, user);
            this.cache.set(user.id, user);
            return user;
        }

        const data = await this.client.requests.make(endpoints.users.main);
        if (!Array.isArray(data)) throw new Error('Invalid API Response.');

        const res = new Map();
        data.forEach(o => {
            const u = new PteroUser(this.client, o);
            this.cache.set(u.id, u);
            res.set(u.id, u);
        });
        return res;
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
        if (options.force !== true) this.cache.forEach(u => { if (id === u.externalId) return u });
        let user = await this.client.requests.make(endpoints.users.ext(id) + (options.withServers ? '?include=servers' : ''));
        user = new PteroUser(this.client, user);
        this.cache.set(user.id, user);
        return user;
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
        const user = new PteroUser(this.client, data);
        this.cache.set(user.id, user);
        return user;
    }

    /** @todo */
    async update(options) {}

    /**
     * Deletes the user account from Pterodactyl.
     * @param {number|PteroUser} user The user to delete.
     * @returns {number}
     */
    async delete(user) {
        if (user instanceof PteroUser) user = user.id;
        await this.client.requests.make(endpoints.users.get(user), { method: 'DELETE' });
        this.cache.delete(user);
        return user;
    }
}

module.exports = UserManager;
