const { PteroUser } = require('../structures/User');
const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class UserManager {
    constructor(client) {
        this.client = client;

        /** @type {Dict<number, PteroUser>} */
        this.cache = new Dict();
    }

    _patch(data) {
        if (data.data) {
            const res = new Dict();
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
     * Resolves a user from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * Returns `null` if not found.
     * @param {string|number|object|PteroUser} obj The object to resolve from.
     * @returns {?PteroUser} The resolved user.
     */
    resolve(obj) {
        if (obj instanceof PteroUser) return obj;
        if (typeof obj === 'number') return this.cache.get(obj) || null;
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj) || null;
        if (obj.relationships?.user) return this._patch(obj.relationships.user);
        return null;
    }

    /**
     * Fetches a user from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the user.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {boolean} [options.withServers] Whether to include servers the user(s) own.
     * @returns {Promise<PteroUser|Dict<number, PteroUser>>} The fetched user(s).
     */
    async fetch(id, options = {}) {
        if (id) {
            if (!options.force) {
                const u = this.cache.get(id);
                if (u) return Promise.resolve(u);
            }
            const data = await this.client.requests.make(
                endpoints.users.get(id) + (options.withServers ? '?include=servers' : '')
            );
            return this._patch(data);
        }
        const data = await this.client.requests.make(
            endpoints.users.main + (options.withServers ? '?include=servers' : '')
        );
        return this._patch(data);
    }

    /**
     * Fetches a user by their external ID with an optional cache check.
     * @param {number} id The ID of the external user.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {boolean} [options.withServers] Whether to include servers the user has.
     * @returns {Promise<PteroUser>} The fetched user.
     */
    async fetchExternal(id, options = {}) {
        if (!options.force) for (const [, user] of this.cache) if (id === user.externalId) return user;
        const data = await this.client.requests.make(
            endpoints.users.ext(id) + (options.withServers ? '?include=servers' : '')
        );
        return this._patch(data);
    }

    /**
     * Queries the API for a user (or users) that match the specified query filter.
     * Keep in mind this does NOT check the cache first, it will fetch from the API directly.
     * Available query filters are:
     * * email
     * * uuid
     * * username
     * * externalId
     * 
     * Available sort options are:
     * * id
     * * -id
     * * uuid
     * * -uuid
     * 
     * @param {string} entity The entity (string) to query.
     * @param {string} [filter] The filter to use for the query (see above).
     * @param {string} [sort] The order to sort the results in (see above).
     * @returns {Promise<Dict<number, PteroUser>>} A dict of the queried user(s).
     */
    async query(entity, filter, sort) {
        if (filter && !['email', 'uuid', 'username', 'externalId'].includes(filter)) throw new Error('Invalid query filter.');
        if (sort && !['id', '-id', 'uuid', '-uuid'].includes(sort)) throw new Error('Invalid sort type.');
        if (!sort && !filter) throw new Error('sort or filter is required to query');
        if (filter === 'externalId') filter = 'external_id';
        const data = await this.client.requests.make(
            endpoints.users.main +
            (filter ? `?filter[${filter}]=${entity}` : "") +
            (sort && filter ? `&sort=${sort}` : "") +
            (sort && !filter ? `?sort=${sort}` : "")
        );
        return this._patch(data);
    }

    /**
     * Creates a new Pterodactyl user account.
     * @param {string} email The email for the account.
     * @param {string} username The username for the acount.
     * @param {string} firstname The firstname for the account.
     * @param {string} lastname The lastname for the account.
     * @returns {Promise<PteroUser>} The new user.
     */
    async create(email, username, firstname, lastname) {
        await this.client.requests.make(
            endpoints.users.main,
            { email, username, first_name: firstname, last_name: lastname },
            'POST'
        );
        const u = await this.query(email, 'email');
        return u.first();
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
     * @returns {Promise<PteroUser>} The updated user instance.
     */
    async update(user, options = {}) {
        if (!options.password) throw new Error('User password is required.');
        if (!Object.keys(options).length) throw new Error('Too few parameters to update.');
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
        await this.client.requests.make(endpoints.users.get(user), null, 'DELETE');
        this.cache.delete(user);
        return true;
    }
}

module.exports = UserManager;
