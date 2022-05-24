export type PermissionResolvable = string | number;

/**
 * Represents all the Pterodactyl server permissions as flags.
 */
export enum Flags {
    WEBSOCKET_CONNECT,

    CONTROL_CONSOLE,
    CONTROL_START,
    CONTROL_STOP,
    CONTROL_RESTART,

    USER_CREATE,
    USER_READ,
    USER_UPDATE,
    USER_DELETE,

    FILE_CREATE,
    FILE_READ,
    'FILE_READ-CONTENT',
    FILE_UPDATE,
    FILE_DELETE,
    FILE_ARCHIVE,
    FILE_SFTP,

    BACKUP_CREATE,
    BACKUP_READ,
    BACKUP_UPDATE,
    BACKUP_DELETE,

    ALLOCATION_READ,
    ALLOCATION_CREATE,
    ALLOCATION_UPDATE,
    ALLOCATION_DELETE,

    STARTUP_READ,
    STARTUP_UPDATE,

    DATABASE_CREATE,
    DATABASE_READ,
    DATABASE_UPDATE,
    DATABASE_DELETE,
    DATABASE_VIEW_PASSWORD,

    SCHEDULE_CREATE,
    SCHEDULE_READ,
    SCHEDULE_UPDATE,
    SCHEDULE_DELETE,

    SETTINGS_RENAME,
    SETTINGS_REINSTALL,

    ADMIN_WEBSOCKET_ERRORS = 40,
    ADMIN_WEBSOCKET_INSTALL,
    ADMIN_WEBSOCKET_TRANSFER
}

function objectFlags(): Record<string, number> {
    return Object
        .entries(Flags)
        .filter(f => typeof f[1] === 'number')
        .reduce<Record<string, number>>((a, b) => {
            a[b[0]] = b[1] as number;
            return a;
        }, {});
}

export class Permissions {
    /** @returns All the server control permissions. */
    static get CONTROL(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.CONTROL_CONSOLE,
            Flags.CONTROL_START,
            Flags.CONTROL_STOP,
            Flags.CONTROL_RESTART
        ]);
    }

    /** @returns All of the user/subuser permissions. */
    static get USERS(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.USER_CREATE,
            Flags.USER_READ,
            Flags.USER_UPDATE,
            Flags.USER_DELETE
        ]);
    }

    /** @returns All of the server file permissions. */
    static get FILES(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.FILE_CREATE,
            Flags.FILE_READ,
            Flags['FILE_READ-CONTENT'],
            Flags.FILE_UPDATE,
            Flags.FILE_DELETE,
            Flags.FILE_ARCHIVE,
            Flags.FILE_SFTP
        ]);
    }

    /** @returns All the server backup permissions. */
    static get BACKUPS(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.BACKUP_CREATE,
            Flags.BACKUP_READ,
            Flags.BACKUP_UPDATE,
            Flags.BACKUP_DELETE
        ]);
    }

    /** @returns All the server allocation permissions. */
    static get ALLOCATIONS(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.ALLOCATION_READ,
            Flags.ALLOCATION_CREATE,
            Flags.ALLOCATION_UPDATE,
            Flags.ALLOCATION_DELETE
        ]);
    }

    /** @returns All the server startup permissions. */
    static get STARTUPS(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.STARTUP_READ,
            Flags.STARTUP_UPDATE
        ]);
    }

    /** @returns All the server database permissions. */
    static get DATABASES(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.DATABASE_CREATE,
            Flags.DATABASE_READ,
            Flags.DATABASE_UPDATE,
            Flags.DATABASE_DELETE,
            Flags.DATABASE_VIEW_PASSWORD
        ]);
    }

    /** @returns All the server schedule permissions. */
    static get SCHEDULES(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.SCHEDULE_CREATE,
            Flags.SCHEDULE_READ,
            Flags.SCHEDULE_UPDATE,
            Flags.SCHEDULE_DELETE
        ]);
    }

    /** @returns All the server settings permissions. */
    static get SETTINGS(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.SETTINGS_RENAME,
            Flags.SETTINGS_REINSTALL
        ]);
    }

    /** @returns The admin permissions. */
    static get ADMIN(): Readonly<Flags[]> {
        return Object.freeze([
            Flags.ADMIN_WEBSOCKET_ERRORS,
            Flags.ADMIN_WEBSOCKET_INSTALL,
            Flags.ADMIN_WEBSOCKET_TRANSFER
        ]);
    }

    /** The raw permission value. */
    public raw: number[];

    /**
     * @param perms The data to resolve permissions from.
     */
    constructor(...perms: PermissionResolvable[]) {
        this.raw = Permissions.resolve(...perms);
    }

    /**
     * Resolves a permissions object from a specified source.
     * @param perms The permissions to resolve.
     * @see {@link PermissionResolvable}.
     * @returns The resolved permissions.
     */
    static resolve(...perms: PermissionResolvable[]): number[] {
        const res: number[] = [];
        const sorted = objectFlags();

        for (const p of perms) {
            if (p in Flags) {
                if (typeof p === 'number') {
                    res.push(p);
                } else {
                    res.push(sorted[p]);
                }
            } else {
                throw new Error(`unknown permission value '${p}'`);
            }
        }

        return res;
    }

    /**
     * @param perms The permissions to check for.
     * @returns True if the current value has any of the specified permissions.
     */
    hasAny(...perms: PermissionResolvable[]): boolean {
        const res = Permissions.resolve(...perms);
        for (let p of res) if (p in this.raw) return true;
        return false;
    }

    /**
     * @param perms The permissions to check for.
     * @returns True if the current value has all of the specified permissions.
     */
    hasAll(...perms: PermissionResolvable[]): boolean {
        const res = Permissions.resolve(...perms);
        for (let p in res) if (!(p in this.raw)) return false;
        return true;
    }

    /**
     * @returns True if the current value includes administrative permissions.
     */
    isAdmin(): boolean {
        return this.raw.some(p => [40, 41, 42].includes(p));
    }

    /**
     * Adds the specified permissions to the current value.
     * @param perms The permissions to add.
     * @returns The updated permissions instance.
     */
    add(...perms: PermissionResolvable[]): this {
        this.raw = this.raw.concat(new Permissions(...perms).raw);
        return this;
    }

    /**
     * Removes the specified permissions from the current value.
     * @param perms The permissions to remove.
     * @returns The updated permissions instance.
     */
    remove(...perms: PermissionResolvable[]): this {
        const res = new Permissions(...perms);
        this.raw = this.raw.filter(p => !res.raw.includes(p));
        return this;
    }

    /**
     * @returns An object with all the permissions having `true` or `false`
     * values if they are currently present.
     */
    serialize(): Record<string, boolean> {
        const res: Record<string, boolean> = {};
        for (let [k, v] of Object.entries(objectFlags()))
            res[k] = this.raw.includes(v);

        return res;
    }

    /** @returns An array of the current permissions in string form. */
    toString(): string[] {
        return this.raw.map(p => Flags[p].toLowerCase().replaceAll('_', '.'));
    }
}
