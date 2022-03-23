const FLAGS = {
    WEBSOCKET_CONNECT: 0,

    CONTROL_CONSOLE: 1,
    CONTROL_START: 2,
    CONTROL_STOP: 3,
    CONTROL_RESTART: 4,

    USER_CREATE: 5,
    USER_READ: 6,
    USER_UPDATE: 7,
    USER_DELETE: 8,

    FILE_CREATE: 9,
    FILE_READ: 10,
    'FILE_READ-CONTENT': 11,
    FILE_UPDATE: 12,
    FILE_DELETE: 13,
    FILE_ARCHIVE: 14,
    FILE_SFTP: 15,

    BACKUP_CREATE: 16,
    BACKUP_READ: 17,
    BACKUP_UPDATE: 18,
    BACKUP_DELETE: 19,

    ALLOCATION_READ: 20,
    ALLOCATION_CREATE: 21,
    ALLOCATION_UPDATE: 22,
    ALLOCATION_DELETE: 23,

    STARTUP_READ: 24,
    STARTUP_UPDATE: 25,

    DATABASE_CREATE: 26,
    DATABASE_READ: 27,
    DATABASE_UPDATE: 28,
    DATABASE_DELETE: 29,
    DATABASE_VIEW_PASSWORD: 30,

    SCHEDULE_CREATE: 31,
    SCHEDULE_READ: 32,
    SCHEDULE_UPDATE: 33,
    SCHEDULE_DELETE: 34,

    SETTINGS_RENAME: 35,
    SETTINGS_REINSTALL: 36,

    ADMIN_WEBSOCKET_ERRORS: 40,
    ADMIN_WEBSOCKET_INSTALL: 41,
    ADMIN_WEBSOCKET_TRANSFER: 42
}

class Permissions {
    /**
     * An object containing all Pterodactyl permissions.
     */
    static get FLAGS() {
        return Object.freeze(FLAGS);
    }

    /**
     * Default Pterodactyl user permissions.
     */
    static get DEFAULT() {
        return Object.freeze({
            CONTROL_CONSOLE: 1,
            CONTROL_START: 2,
            CONTROL_STOP: 3,
            CONTROL_RESTART: 4
        });
    }

    /**
     * @param {PermissionResolvable} data The data to resolve permissions from.
     */
    constructor(data) {
        /**
         * The raw permissions object.
         * @type {object}
         */
        this.raw = Permissions.resolve(data);
    }

    /**
     * Returns a boolean on whether the specified permissions are currently available.
     * This function uses AND logic for checking more than one permission.
     * @param {string|number|PermissionResolvable} perms The permissions to check for.
     * @returns {boolean}
     */
    has(perms) {
        if (typeof perms === 'string' || typeof perms === 'number') perms = [perms];
        perms = Object.keys(Permissions.resolve(perms));

        for (const p of perms) if (!this.raw[p]) return false;
        return true;
    }

    /**
     * Returns a boolean on whether the current permissions are administrative.
     * @returns {boolean}
     */
    isAdmin() {
        return this.toArray().some(p => p.includes('ADMIN'));
    }

    /**
     * Resolves a permissions object from a specified source.
     * @see {@link PermissionResolvable}
     * @param {PermissionResolvable} perms The data to resolve the permissions from.
     * @returns {object} The resolved permissions.
     */
    static resolve(perms) {
        const res = {};
        if (typeof perms === 'object' && !Array.isArray(perms)) perms = Object.keys(perms);
        if (!perms || !perms?.length) return {};
        if (diff(perms)) throw new TypeError('Permissions must be all strings or all numbers.');

        if (typeof perms[0] === 'string') perms = Object.keys(this.fromStrings(perms));
        const entries = Object.entries(this.FLAGS);
        for (const p of perms) {
            if (
                this.FLAGS[p] === undefined &&
                !entries.find(e => e[1] === p)
            ) throw new Error(`Unknown permission '${p}'.`);
            const e = entries.find(e => e.includes(p));
            res[e[0]] = e[1];
        }
        return res;
    }

    /**
     * Returns an object with all the permissions having `true` or `false` values
     * if they are currently present.
     * @returns {object} The serialized permissions.
     */
    serialize() {
        const res = {};
        Object.keys(Permissions.FLAGS).forEach(f => res[f] = this.has(f));
        return res;
    }

    /**
     * Returns an array of the current permissions.
     * @returns {string[]} The permissions array.
     */
    toArray() {
        return Object.keys(this.raw);
    }

    /**
     * Returns an array of the current permissions in string form.
     * @returns {string[]} The permission strings array.
     */
    toStrings() {
        return this.toArray().map(p => p.toLowerCase().replace(/_/g, '.'));
    }

    /**
     * Returns a permission object from the default string permissions.
     * @param {string[]} perms The array of default permissions.
     * @returns {object} The resolved permissions.
     */
    static fromStrings(perms) {
        const res = {};
        if (perms.includes('*')) return Object.assign({}, Permissions.FLAGS);
        for (let p of perms) {
            p = p.toUpperCase().replace(/\./g, '_');
            if (Permissions.FLAGS[p] === undefined) throw new Error(`Unknown permission '${p}'.`);
            res[p] = Permissions.FLAGS[p];
        }
        return res;
    }
}

module.exports = Permissions;

function diff(perms) {
    return perms.some(p => typeof p === 'string') && perms.some(p => typeof p === 'number');
}

/**
 * Data that can be resolved into a Permissions object. Valid types are:
 * * An array of strings
 * * An array of numbers
 * * An object
 * @typedef {string[]|number[]|object} PermissionResolvable
 */
