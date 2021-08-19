const { Node } = require('../../structures');

class NodeManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<string, Node>}
         */
        this.cache = new Map();
    }

    async fetch(id = '', force = false) {}

    async create(options) {}

    async update(id, options) {}

    async delete(id) {}
}

module.exports = NodeManager;
