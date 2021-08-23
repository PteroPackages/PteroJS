class Node {
    constructor(client, data) {
        this.client = client;
        data = data.attributes;

        /**
         * @type {number}
         */
        this.id = data.id;

        /**
         * @type {string}
         */
        this.uuid = data.uuid;

        /**
         * @type {boolean}
         */
        this.public = data.public;

        /**
         * @type {string}
         */
        this.name = data.name;

        /**
         * @type {?string}
         */
        this.description = dat.description || null;

        /**
         * @type {number}
         */
        this.location = data.location_id;

        /**
         * @type {string}
         */
        this.fqdn = data.fqdn;

        /**
         * @type {string}
         */
        this.scheme = data.scheme;

        /**
         * @type {boolean}
         */
        this.behindProxy = data.behind_proxy;

        /**
         * @type {boolean}
         */
        this.maintenance = data.maintenance_mode;

        /**
         * @type {number}
         */
        this.memory = data.memory;

        /**
         * @type {number}
         */
        this.overallocatedMemory = data.memory_overallocate;

        /**
         * @type {number}
         */
        this.overallocatedDisk = data.disk_overallocate;

        /**
         * @type {number}
         */
        this.uploadSize = data.upload_size;

        /**
         * @type {object}
         */
        this.daemon = {
            /**
             * @type {number}
             */
            listening: data.daemon_listen,

            /**
             * @type {number}
             */
            sfpt: data.daemon_sfpt,

            /**
             * @type {string}
             */
            base: data.daemon_base
        }

        /**
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
    }

    async getConfig() {}

    async update(options) {}

    /**
     * Returns the JSON value of the Node.
     * @returns {object}
     */
    toJSON() {
        return JSON.parse(JSON.stringify(this));
    }
}

module.exports = Node;
