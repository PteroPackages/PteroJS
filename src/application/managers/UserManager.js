const { PteroUser } = require('../../structures');

class UserManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<string, PteroUser>}
         */
        this.cache = new Map();
    }

    async fetch(id = '', force = false) {}

    async fetchExternal(id, withServers = true) {}

    async create(email, username, firstname, lastname) {}

    async update(options) {}

    async delete(id) {}
}

module.exports = UserManager;
