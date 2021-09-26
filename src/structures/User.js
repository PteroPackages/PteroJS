const ApplicationServer = require('./ApplicationServer');
const Permissions = require('./Permissions');
const { PermissionResolvable } = require('./Permissions');
const Dict = require('../structures/Dict');
const json = require('../structures/Jsonifier');
const c_path = require('../client/managers/endpoints');

class BaseUser {
    constructor(client, data) {
        this.client = client;
        this._patch(data);
    }

    _patch(data) {
        if ('id' in data) {
            /** @type {number} */
            this.id = data.id;
        }

        if ('username' in data) {
            /** @type {string} */
            this.username = data.username;
        }

        if ('email' in data) {
            /** @type {string} */
            this.email = data.email;
        }

        if ('first_name' in data) {
            /** @type {string} */
            this.firstname = data.first_name;
        }

        if ('last_name' in data) {
            /** @type {string} */
            this.lastname = data.last_name;
        }

        if ('language' in data) {
            /** @type {string} */
            this.language = data.language;
        }
    }

    /**
     * Returns the string value of the user.
     * @returns {string} The fullname.
     */
    toString() {
        return this.firstname +' '+ this.lastname;
    }

    /**
     * Returns the JSON value of the User.
     * @returns {object} The JSON value.
     */
    toJSON() {
        return json(this, ['client']);
    }
}

class PteroUser extends BaseUser {
    constructor(client, data) {
        super(client, data);
    }

    _patch(data) {
        super._patch(data);

        if ('external_id' in data) {
            /** @type {string} */
            this.externalId = data.external_id;
        }

        if ('uuid' in data) {
            /** @type {string} */
            this.uuid = data.uuid;
        }

        if ('root_admin' in data) {
            /** @type {boolean} */
            this.isAdmin = data.root_admin ?? false;
        }

        if ('2fa' in data) {
            /** @type {boolean} */
            this.tfa = data['2fa'];
        }

        if ('created_at' in data) {
            /** @type {Date} */
            this.createdAt = new Date(data.created_at);
            /** @type {number} */
            this.createdTimestamp = this.createdAt.getTime();
        }

        if ('updated_at' in data) {
            /** @type {?Date} */
            this.updatedAt = data['updated_at'] ? new Date(data['updated_at']) : null;
            /** @type {?number} */
            this.updatedTimestamp = this.updatedAt?.getTime() || null;
        }

        if (!this.relationships) {
            /**
             * A map of servers the user is connected to.
             * @type {?Dict<number, ApplicationServer>}
             */
            this.relationships = this.client.servers.resolve(data);
        }
    }

    /** @todo */
    async update(options = {}) {}
}

class PteroSubUser extends BaseUser {
    constructor(client, data) {
        super(client, data);
        this._patch(data);

        /** @type {Date} */
        this.createdAt = new Date(data.created_at);
        /** @type {number} */
        this.createdTimestamp = this.createdAt.getTime();

        /** @type {Permissions} */
        this.permissions = new Permissions(data.permissions ?? {});
    }

    _patch(data) {
        super._patch(data);

        if ('uuid' in data) {
            /** @type {string} */
            this.uuid = data.uuid;
        }

        if ('image' in data) {
            /** @type {string} */
            this.image = data.image;
        }

        if ('2fa_enabled' in data) {
            /** @type {boolean} */
            this.enabled = data['2fa_enabled'];
        }
    }

    /**
     * Updates the subuser's server permissions.
     * @param {PermissionResolvable} perms The permissions to set.
     * @returns {Promise<PteroSubUser>} The updated user instance.
     */
    async setPermissions(perms) {
        perms = new Permissions(perms);
        await this.client.requests.make(
            c_path.servers.users.get(this.id), { permissions: perms.toStrings() }, 'POST'
        );
        this.permissions = perms;
        return this;
    }
}

class ClientUser extends BaseUser {
    constructor(client, data) {
        super(client, data);

        /** @type {boolean} */
        this.isAdmin = data.admin;

        /**
         * An array of 2FA authentication tokens.
         * @type {string[]}
         */
        this.tokens = [];

        /**
         * An array of API keys for Pterodactyl.
         * @type {APIKey[]}
         */
        this.apikeys = [];
    }

    /**
     * Fetches a 2FA code linked to the client's account.
     * @returns {Promise<string>} The 2FA code.
     */
    async get2faCode() {
        const data = await this.client.requests.make(c_path.account.tfa);
        return data.data.image_url_data;
    }

    /**
     * Enables 2FA for the client user and returns an array of authentication tokens.
     * @param {string} code The 2FA code to authenticate with.
     * @returns {Promise<string[]>} The auth tokens.
     */
    async enable2fa(code) {
        const data = await this.client.requests.make(
            endpoints.account.tfa, { code }, 'POST'
        );
        this.tokens.push(...data.attributes.tokens);
        return this.tokens;
    }

    /**
     * Disables 2FA for the client user.
     * @param {string} password The client user's account password.
     * @returns {Promise<void>}
     */
    async disable2fa(password) {
        await this.client.requests.make(
            endpoints.account.tfa, { password }, 'DELETE'
        );
        this.tokens = [];
    }

    /**
     * Updates the client user's email.
     * @param {string} email The new email.
     * @param {string} password The client user's password.
     * @returns {Promise<ClientUser>} The updated client user instance.
     */
    async updateEmail(email, password) {
        await this.client.requests.make(
            endpoints.account.email, { email, password }, 'PUT'
        );
        this.email = email;
        return this;
    }

    /**
     * Updates the client user's password. **Note:** the PteroJS library does not store
     * passwords on the client user object.
     * @param {string} oldpass The current account password.
     * @param {string} newpass The new account password.
     * @returns {Promise<void>}
     */
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

    /**
     * Returns an array of API keys linked to the client user's account.
     * @returns {Promise<APIKey[]>} An array of APIKey objects.
     */
    async fetchKeys() {
        const data = await this.client.requests.make(endpoints.account.apiKeys);
        this.apikeys = [];
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

    /**
     * Creates a new API key linked to the client user's account.
     * @param {string} description A brief description of the use of the API key.
     * @param {string[]} [allowed] An array of whitelisted IPs for the key.
     * @returns {Promise<APIKey>} The new API key.
     */
    async createKey(description, allowed = []) {
        const data = await this.client.requests.make(
            endpoints.account.apiKeys,
            { description, allowed_ips: allowed },
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

    /**
     * Deletes the specified API key linked to the client user's account.
     * @param {string} id The identifier of the API key to delete.
     * @returns {Promise<void>}
     */
    async deleteKey(id) {
        await this.client.requests.make(c_path.account.apikeys +`/${id}`, { method: 'DELETE' });
        this.apikeys = this.apikeys.filter(k => k.identifier !== id);
    }
}

module.exports = {
    BaseUser,
    PteroUser,
    PteroSubUser,
    ClientUser
}

/**
 * Represents a Pterodactyl API key.
 * @typedef {object} APIKey
 * @property {string} identifier The identifier of the API key.
 * @property {string} description The description of the API key, usually for usage.
 * @property {string[]} allowedIPs An array of IPs allowed to use this API key.
 * @property {?Date} lastUsedAt The last recorded date of usage.
 * @property {Date} createdAt The date the API key was created.
 */
