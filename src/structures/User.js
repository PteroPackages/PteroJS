const ApplicationServer = require('./ApplicationServer');
const Permissions = require('./Permissions');
const { PermissionResolvable } = require('./Permissions');
const Dict = require('./Dict');
const caseConv = require('../util/caseConv');
const c_path = require('../client/endpoints');

let loggedDeprecated = false;

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
        return caseConv.snakeCase(this, ['client']);
    }
}

class PteroUser extends BaseUser {
    constructor(client, data) {
        super(client, data);

        /** @type {string} */
        this.uuid = data.uuid;

        this._patch(data);
    }

    _patch(data) {
        super._patch(data);

        if ('external_id' in data) {
            /** @type {string} */
            this.externalId = data.external_id;
        }

        if ('root_admin' in data) {
            /** @type {boolean} */
            this.isAdmin = data.root_admin ?? false;
        }

        if ('2fa' in data) {
            /**
             * @type {boolean}
             * @deprecated Use {@link PteroUser.twoFactor} instead.
             */
            this.tfa = data['2fa'];

            /** @type {boolean} */
            this.twoFactor = data['2fa'];

            if (!loggedDeprecated) {
                process.emitWarning(
                    "'PteroUser#tfa' is deprecated, use 'PteroUser#twoFactor' instead",
                    'Deprecated'
                );
                loggedDeprecated = true;
            }
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

    /**
     * Returns a formatted URL to the user in the admin panel.
     * @returns {string} The formatted URL.
     */
    get adminURL() {
        return `${this.client.domain}/admin/users/view/${this.id}`;
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
    async update(options = {}) {
        return this.client.users.update(this, options);
    }

    /**
     * Deletes the user account from Pterodactyl.
     * @returns {Promise<boolean>}
     */
    async delete() {
        return this.client.users.delete(this);
    }
}

class PteroSubUser extends BaseUser {
    constructor(client, server, data) {
        super(client, data);

        /** @type {string} */
        this.uuid = data.uuid;

        /** @type {string} */
        this._server = server;

        /** @type {Date} */
        this.createdAt = new Date(data.created_at);

        /** @type {number} */
        this.createdTimestamp = this.createdAt.getTime();

        /** @type {Permissions} */
        this.permissions = new Permissions(data.permissions ?? {});

        this._patch(data);
    }

    _patch(data) {
        super._patch(data);

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
     * Returns a formatted URL to the subuser.
     * @returns {string} The formatted URL.
     */
    get panelURL() {
        return `${this.client.domain}/server/${this._server}/users`;
    }

    /**
     * Updates the subuser's server permissions.
     * @param {PermissionResolvable} perms The permissions to set.
     * @returns {Promise<PteroSubUser>} The updated user instance.
     */
    async setPermissions(perms) {
        perms = new Permissions(perms);
        await this.client.requests.post(
            c_path.servers.users.get(this._server, this.uuid),
            { permissions: perms.toStrings() }
        );
        this.permissions = perms;
        return this;
    }
}

class ClientUser extends BaseUser {
    constructor(client, data) {
        super(client, data);
        super._patch(data);

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
     * Returns a formatted URL to the client account.
     * @returns {string} The formatted URL.
     */
    get panelURL() {
        return `${this.client.domain}/account`;
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
        const data = await this.client.requests.post(
            c_path.account.tfa, { code }
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
        await this.client.requests.delete(
            c_path.account.tfa, { password }
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
        await this.client.requests.put(
            c_path.account.email, { email, password }
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
        if (oldpass === newpass) return Promise.resolve();
        return await this.client.requests.put(
            c_path.account.password,
            {
                current_password: oldpass,
                password: newpass,
                password_confirmation: newpass
            }
        );
    }

    /**
     * Returns an array of API keys linked to the client user's account.
     * @returns {Promise<APIKey[]>} An array of APIKey objects.
     */
    async fetchKeys() {
        const data = await this.client.requests.make(c_path.account.apikeys);
        this.apikeys = [];

        for (let o of data.data) {
            o = o.attributes;
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
        const data = await this.client.requests.post(
            c_path.account.apikeys,
            { description, allowed_ips: allowed }
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
        await this.client.requests.delete(
            c_path.account.apikeys +`/${id}`
        );
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
