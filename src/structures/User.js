const endpoints = require('../client/managers/Endpoints');

/**
 * @abstract
 */
class BaseUser {
    constructor(client, data) {
        this.client = client;

        /**
         * @type {number}
         */
        this.id = data.id;

        /**
         * @type {string}
         */
        this.username = data.username;

        /**
         * @type {string}
         */
        this.email = data.email;

        /**
         * @type {string}
         */
        this.firstname = data.first_name;

        /**
         * @type {string}
         */
        this.lastname = data.last_name;

        /**
         * @type {string}
         */
        this.language = data.language;
    }

    get fullname() {
        return this.firstname +' '+ this.lastname;
    }

    /**
     * Returns the JSON value of the User.
     * @returns {object}
     */
    toJSON() {
        return JSON.parse(JSON.stringify(this));
    }
}

class PteroUser extends BaseUser {
    constructor(client, data) {
        super(client, data);

        /**
         * @type {string}
         */
        this.externalId = data.external_id;

        /**
         * @type {string}
         */
        this.uuid = data.uuid;

        /**
         * @type {boolean}
         */
        this.isAdmin = data.root_admin ?? false;

        /**
         * @type {boolean}
         */
        this.tfa = data['2fa'];

        /**
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * @type {number}
         */
        this.createdTimestamp = this.createdAt.getTime();

        /**
         * @type {?Date}
         */
        this.updatedAt = data['updated_at'] ? new Date(data['updated_at']) : null;

        /**
         * @type {?number}
         */
        this.updatedTimestamp = this.updatedAt?.getTime() || null;
    }
}

class PteroSubUser extends BaseUser {
    constructor(client, data) {
        super(client, data);

        /**
         * @type {string}
         */
        this.uuid = data.uuid;

        /**
         * @type {string}
         */
        this.image = data.image;

        /**
         * @type {boolean}
         */
        this.enabled = data['2fa_enabled'];

        /**
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * @type {number}
         */
        this.createdTimestamp = this.createdAt.getTime();

        /**
         * @type {Array<string>}
         */
        this.permissions = data.permissions;
    }
}

class ClientUser extends BaseUser {
    constructor(client, data) {
        super(client, data);

        /**
         * @type {boolean}
         */
        this.isAdmin = data.admin;

        /**
         * An array of 2FA authentication tokens.
         * @type {Array<string>}
         */
        this.tokens = [];

        /**
         * An array of API keys for Pterodactyl.
         * @type {Array<APIKey>}
         */
        this.apikeys = [];
    }

    async get2faCode() {
        const data = await this.client.requests.make(endpoints.account.tfa);
        return data.data.image_url_data;
    }

    async enable2fa(code) {
        const data = await this.client.requests.make(
            endpoints.account.tfa, { code }, 'POST'
        );
        this.tokens.push(...data.attributes.tokens);
        return this.tokens;
    }

    async disable2fa(password) {
        return await this.client.requests.make(
            endpoints.account.tfa, { password }, 'DELETE'
        );
    }

    async updateEmail(email, password) {
        await this.client.requests.make(
            endpoints.account.email, { email, password }, 'PUT'
        );
        this.email = email;
        return true;
    }

    async updatePassword(oldpass, newpass) {
        if (oldpass === newpass) return;
        return await this.client.requests.make(
            endpoints.account.password,
            {
                current_password: oldpass,
                password: newpass,
                password_confirmation: newpass
            },
            'PUT'
        );
    }

    async fetchKeys() {
        const data = await this.client.requests.make(endpoints.account.apiKeys);
        for (const o of data.data) {
            this.apikeys.push({
                identifier: o.identifier,
                description: o.description,
                allowedIPs: o.allowed_ips,
                lastUsedAt: o.last_used_at ? new Date(o.last_used_at) : null,
                createdAt: new Date(o.created_at)
            });
        }
        return this.apikeys;
    }

    async createKey(description, allowed) {
        const data = await this.client.requests.make(
            endpoints.account.apiKeys,
            { description, allowed_ips: allowed ?? [] },
            'POST'
        );
        const att = data.attributes;
        this.apikeys.push({
            identifier: att.identifier,
            description: att.description,
            allowedIPs: att.allowed_ips,
            lastUsedAt: att.last_used_at ? new Date(att.last_used_at) : null,
            createdAt: new Date(att.created_at)
        });
        return this.apikeys.find(k => k.identifier === att.identifier);
    }

    async deleteKey(key) {
        await this.client.requests.make(endpoints.account.apiKeys +`/${key}`, { method: 'DELETE' });
        const i = this.apikeys.indexOf(this.apikeys.find(k => k === key));
        if (i < 0) return;
        this.apikeys.splice(i);
    }
}

exports.BaseUser = BaseUser;
exports.PteroUser = PteroUser;
exports.PteroSubUser = PteroSubUser;
exports.ClientUser = ClientUser;

/**
 * Represents a Pterodactyl API key.
 * @typedef {object} APIKey
 * @property {string} identifier The identifier of the API key.
 * @property {string} description The description of the API key, usually for usage.
 * @property {Array<string>} allowedIPs An array of IPs allowed to use this API key.
 * @property {?Date} lastUsedAt The last recorded date of usage.
 * @property {Date} createdAt The date the API key was created.
 */
