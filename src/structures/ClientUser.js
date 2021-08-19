const { BaseUser } = require('../structures');

class ClientUser extends BaseUser {
    constructor(client, data) {
        super(client, data);

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

    async get2faCode() {}

    async enable2fa(code) {}

    async disable2fa(password) {}

    async updateEmail(email) {}

    async updatePassword(oldpass, newpass) {}

    async fetchKeys() {}

    async createKey(description, allowed) {}

    async deleteKey(id) {}
}

module.exports = ClientUser;

/**
 * Represents a Pterodactyl API key.
 * @typedef {object} APIKey
 * @property {string} identifier The identifier of the API key.
 * @property {string} description The description of the API key, usually for usage.
 * @property {Array<string>} allowedIPs An array of IPs allowed to use this API key.
 * @property {?Date} lastUsedAt The last recorded date of usage.
 * @property {Date} createdAt The date the API key was created.
 */
