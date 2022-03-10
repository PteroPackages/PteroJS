const { PteroUser } = require('../structures/User');
const Dict = require('../structures/Dict');
const build = require('../util/query');
const endpoints = require('./endpoints');

class UserManager {
    /**
     * Allowed filter arguments for users.
     */
    static get FILTERS() {
        return Object.freeze([
            'email', 'uuid', 'uuidShort',
            'name', 'image', 'external_id'
        ]);
    }

    /**
     * Allowed sort arguments for users.
     */
    static get SORTS() {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

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

            if (this.client.options.users.cache) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }

        const u = new PteroUser(this.client, data.attributes);
        if (this.client.options.users.cache) this.cache.set(u.id, u);
        return u;
    }

    /**
     * Resolves a user from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * Returns `undefined` if not found.
     * @param {string|number|object|PteroUser} obj The object to resolve from.
     * @returns {?PteroUser} The resolved user.
     */
    resolve(obj) {
        if (obj instanceof PteroUser) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj);
        if (obj.relationships?.user) return this._patch(obj.relationships.user);
        return undefined;
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
        if (id && !options.force) {
            const u = this.cache.get(id);
            if (u) return u;
        }

        const data = await this.client.requests.get(
            (id ? endpoints.users.get(id) : endpoints.users.main) +
            (options.withServers ? '?include=servers' : '')
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
        if (!options.force) {
            for (const [, user] of this.cache)
                if (id === user.externalId) return user;
        }

        const data = await this.client.requests.get(
            endpoints.users.ext(id) + (options.withServers ? '?include=servers' : '')
        );
        return this._patch(data);
    }

    /**
     * Queries the API for a user (or users) that match the specified query filter.
     * Keep in mind this does NOT check the cache first, it will fetch from the API directly.
     * Available query filters are:
     * * email
     * * name
     * * uuid
     * * uuidShort
     * * identifier (alias for uuidShort)
     * * externalId
     * * image
     * 
     * Available sort options are:
     * * id
     * * -id
     * * uuid
     * * -uuid
     * 
     * @param {string} entity The entity (string) to query.
     * @param {string} [filter] The filter to use for the query.
     * @param {string} [sort] The order to sort the results in.
     * @returns {Promise<Dict<number, PteroUser>>} A dict of the queried users.
     */
    async query(entity, filter, sort) {
        if (!sort && !filter) throw new Error('Sort or filter is required.');
        if (filter === 'identifier') filter = 'uuidShort';
        if (filter === 'externalId') filter = 'external_id';

        const { FILTERS, SORTS } = UserManager;
        const query = build(
            { filter:[filter, entity], sort },
            { filters: FILTERS, sorts: SORTS }
        );

        const data = await this.client.requests.get(endpoints.users.main + query);
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
        await this.client.requests.post(
            endpoints.users.main,
            { email, username, first_name: firstname, last_name: lastname }
        );
        const data = await this.query(email, 'email', '-id');
        return data.find(u => u.email === email);
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

        const data = await this.client.requests.patch(
            endpoints.users.get(id),
            {
                email,
                username,
                first_name: firstname,
                last_name: lastname,
                language,
                password
            }
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
        await this.client.requests.delete(endpoints.users.get(user));
        this.cache.delete(user);
        return true;
    }
}

module.exports = UserManager;
