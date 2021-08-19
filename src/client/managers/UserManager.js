const { PteroSubUser } = require('../../structures');

class UserManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<string, PteroSubUser>}
         */
        this.cache = new Map();
    }

    async fetch(id = '', force = false) {}

    async create(email, permissions) {}

    async setPermissions(permissions) {}

    async delete(id) {}
}

module.exports = UserManager;
