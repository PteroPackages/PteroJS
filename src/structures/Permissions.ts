export type PermissionFlag = { [key: string]: number };
export type PermissionResolvable =
    | string[]
    | number[]
    | object;

export const FLAGS: PermissionFlag = {
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

export class Permissions {
    /** An object containing all Pterodactyl permissions. */
    static get FLAGS(): Readonly<PermissionFlag> {
        return Object.freeze(FLAGS);
    }

    /** Default Pterodactyl user permissions. */
    static get DEFAULT(): Readonly<PermissionFlag> {
        return Object.freeze({
            CONTROL_CONSOLE: 1,
            CONTROL_START: 2,
            CONTROL_STOP: 3,
            CONTROL_RESTART: 4
        });
    }

    public raw: PermissionFlag;

    /**
     * @param {PermissionResolvable} data The data to resolve permissions from.
     */
    constructor(data: PermissionResolvable) {
        /**
         * The raw permissions object.
         * @type {object}
         */
        this.raw = Permissions.resolve(data);
    }

    /**
     * Returns a boolean on whether the specified permissions are currently available.
     * This function uses AND logic for checking more than one permission.
     */
    has(perms: string | number | PermissionResolvable): boolean {
        if (typeof perms === 'string' || typeof perms === 'number') perms = [perms];
        const keys = Object.keys(Permissions.resolve(perms));

        for (const p of keys) if (!this.raw[p]) return false;
        return true;
    }

    /**
     * Returns a boolean on whether the current permissions are administrative.
     */
    isAdmin(): boolean {
        return this.toArray().some(p => p.includes('ADMIN'));
    }

    /**
     * Resolves a permissions object from a specified source.
     * @see {@link PermissionResolvable}
     */
    static resolve(perms: PermissionResolvable): PermissionFlag {
        const res: PermissionFlag = {};
        let keys: (string | number)[] = [];
        if (typeof perms === 'object' && !Array.isArray(perms)) keys = Object.keys(perms);
        if (!keys?.length) return {};
        if (diff(keys)) throw new TypeError('Permissions must be all strings or all numbers.');

        if (typeof keys[0] === 'string') perms = Object.keys(this.fromStrings(keys as string[]));
        const entries = Object.entries(this.FLAGS);
        for (const p of keys) {
            const e = entries.find(e => e.includes(p));
            if (
                this.FLAGS[p] === undefined &&
                e === undefined
            ) throw new Error(`Unknown permission '${p}'.`);
            res[e![0]] = e![1];
        }
        return res;
    }

    /**
     * Returns an object with all the permissions having `true` or `false` values
     * if they are currently present.
     */
    serialize(): { [key: string]: boolean } {
        const res: { [key: string]: boolean } = {};
        Object.keys(Permissions.FLAGS).forEach(f => res[f] = this.has(f));
        return res;
    }

    /** Returns an array of the current permissions. */
    toArray(): string[] {
        return Object.keys(this.raw);
    }

    /** Returns an array of the current permissions in string form. */
    toStrings(): string[] {
        return this.toArray().map(p => p.toLowerCase().replace(/_/g, '.'));
    }

    /** Returns a permission object from the default string permissions. */
    static fromStrings(perms: string[]): PermissionFlag {
        const res: PermissionFlag = {};
        if (perms.includes('*')) return Object.assign({}, Permissions.FLAGS);
        for (let p of perms) {
            p = p.toUpperCase().replace(/\./g, '_');
            if (Permissions.FLAGS[p] === undefined) throw new Error(`Unknown permission '${p}'.`);
            res[p] = Permissions.FLAGS[p];
        }
        return res;
    }
}

function diff(perms: (string | number)[]): boolean {
    return perms.some(p => typeof p === 'string') && perms.some(p => typeof p === 'number');
}
