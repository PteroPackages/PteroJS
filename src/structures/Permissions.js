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
    FILE_UPDATE: 11,
    FILE_DELETE: 12,
    FILE_ARCHIVE: 13,
    FILE_SFTP: 14,

    BACKUP_CREATE: 15,
    BACKUP_READ: 16,
    BACKUP_UPDATE: 17,
    BACKUP_DELETE: 18,

    ALLOCATION_READ: 19,
    ALLOCATION_CREATE: 20,
    ALLOCATION_UPDATE: 21,
    ALLOCATION_DELETE: 22,

    STARTUP_READ: 23,
    STARTUP_UPDATE: 24,

    DATABASE_CREATE: 25,
    DATABASE_READ: 26,
    DATABASE_UPDATE: 27,
    DATABASE_DELETE: 28,
    DATABASE_VIEW_PASSWORD: 29,

    SCHEDULE_CREATE: 30,
    SCHEDULE_READ: 31,
    SCHEDULE_UPDATE: 32,
    SCHEDULE_DELETE: 33,

    SETTINGS_RENAME: 34,
    SETTINGS_REINSTALL: 35,

    ADMIN_WEBSOCKET_INSTALL: 39,
    ADMIN_WEBSOCKET_ERRORS: 40
}

class Permissions {
    /**
     * An object containing all Pterodactyl permissions.
     */
    FLAGS = Object.freeze(FLAGS);

    /**
     * Default Pterodactyl user permissions.
     */
    DEFAULT = Object.freeze({
        CONTROL_CONSOLE: 1,
        CONTROL_START: 2,
        CONTROL_STOP: 3,
        CONTROL_RESTART: 4
    });

    constructor(data) {
        /**
         * The raw permissions object.
         * @type {object}
         */
        this.raw = this.resolve(data);
    }

    /**
     * Returns a boolean on whether the specified permissions are currently available.
     * @param {string|number|PermissionResolvable} perms The permissions to check for.
     * @returns {boolean}
     */
    has(perms) {
        if (typeof perms === 'string' || typeof perms === 'number') perms = [perms];
        perms = Object.keys(this.resolve(perms));

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
     * @returns {object}
     */
    static resolve(perms) {
        const res = {};
        if (typeof perms === 'object' && !Array.isArray(perms)) perms = Object.keys(perms);
        if (!perms.every(p => typeof p == 'string' || typeof p == 'number')) throw new Error('Invalid permissions type array (must be strings or numbers only).');
        if (diff(perms)) throw new Error('Permissions must be all strings or all numbers.');

        if (perms.some(p => typeof p === 'string')) perms = this.resolve(this.fromStrings(perms));
        const entries = Object.entries(this.FLAGS);
        for (const p of perms) {
            if (!this.FLAGS[p] && !entries.find(e => e[1] === p)) throw new Error(`Unknown permission '${p}.`);
            const e = entries.find(e => e.includes(p));
            res[e[0]] = e[1];
        }
        return res;
    }

    /**
     * Returns an object with all the permissions having `true` or `false` values
     * if they are currently present.
     * @returns {object}
     */
    serialize() {
        const res = {};
        Object.keys(this.FLAGS).forEach(f => res[f] = this.has(f));
        return res;
    }

    /**
     * Returns an array of the current permissions.
     * @returns {Array<string>}
     */
    toArray() {
        return Object.keys(this.raw);
    }

    /**
     * Returns an array of the current permissions in string form.
     * @returns {Array<string>}
     */
    toStrings() {
        return this.toArray().map(p => p.toLowerCase().replace('_', '.'));
    }

    /**
     * Returns a permission object from the default string permissions.
     * @param {Array<string>} perms The array of default permissions.
     * @returns {object}
     */
    static fromStrings(perms) {
        return Object.keys(this.resolve(perms)).map(p => p.toUpperCase().replace('.', '_'));
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
 * @typedef {Array<string>|Array<number>|object} PermissionResolvable
 */
