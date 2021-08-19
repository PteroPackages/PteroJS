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

exports.BaseUser = BaseUser;
exports.PteroUser = PteroUser;
exports.PteroSubUser = PteroSubUser;
