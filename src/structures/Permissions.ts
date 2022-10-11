/**
 * Represents all the Pterodactyl server permissions as flags.
 */
export enum Flags {
    WEBSOCKET_CONNECT = 'websocket.connect',

    CONTROL_CONSOLE = 'control.console',
    CONTROL_START = 'control.start',
    CONTROL_STOP = 'control.stop',
    CONTROL_RESTART = 'control.restart',

    USER_CREATE = 'user.create',
    USER_READ = 'user.read',
    USER_UPDATE = 'user.update',
    USER_DELETE = 'user.delete',

    FILE_CREATE = 'file.create',
    FILE_READ = 'file.read',
    FILE_READ_CONTENT = 'file.read-content',
    FILE_UPDATE = 'file.update',
    FILE_DELETE = 'file.delete',
    FILE_ARCHIVE = 'file.archive',
    FILE_SFTP = 'file.sftp',

    BACKUP_CREATE = 'backup.create',
    BACKUP_READ = 'backup.read',
    BACKUP_UPDATE = 'backup.update',
    BACKUP_DELETE = 'backup.delete',

    ALLOCATION_READ = 'allocation.read',
    ALLOCATION_CREATE = 'allocation.create',
    ALLOCATION_UPDATE = 'allocation.update',
    ALLOCATION_DELETE = 'allocation.delete',

    STARTUP_READ = 'startup.read',
    STARTUP_UPDATE = 'startup.update',

    DATABASE_CREATE = 'database.create',
    DATABASE_READ = 'database.read',
    DATABASE_UPDATE = 'database.update',
    DATABASE_DELETE = 'database.delete',
    DATABASE_VIEW_PASSWORD = 'database.view_password',

    SCHEDULE_CREATE = 'schedule.create',
    SCHEDULE_READ = 'schedule.read',
    SCHEDULE_UPDATE = 'schedule.update',
    SCHEDULE_DELETE = 'schedule.delete',

    SETTINGS_RENAME = 'settings.rename',
    SETTINGS_REINSTALL = 'settings.reinstall',

    ADMIN_WEBSOCKET_ERRORS = 'admin.websocket.errors',
    ADMIN_WEBSOCKET_INSTALL = 'admin.websocket.install',
    ADMIN_WEBSOCKET_TRANSFER = 'admin.websocket.transfer',
}

export class Permissions {
    /** @returns All the server control permissions. */
    static get CONTROL(): readonly Flags[] {
        return Object.freeze([
            Flags.CONTROL_CONSOLE,
            Flags.CONTROL_START,
            Flags.CONTROL_STOP,
            Flags.CONTROL_RESTART,
        ]);
    }

    /** @returns All of the user/subuser permissions. */
    static get USERS(): readonly Flags[] {
        return Object.freeze([
            Flags.USER_CREATE,
            Flags.USER_READ,
            Flags.USER_UPDATE,
            Flags.USER_DELETE,
        ]);
    }

    /** @returns All of the server file permissions. */
    static get FILES(): readonly Flags[] {
        return Object.freeze([
            Flags.FILE_CREATE,
            Flags.FILE_READ,
            Flags.FILE_READ_CONTENT,
            Flags.FILE_UPDATE,
            Flags.FILE_DELETE,
            Flags.FILE_ARCHIVE,
            Flags.FILE_SFTP,
        ]);
    }

    /** @returns All the server backup permissions. */
    static get BACKUPS(): readonly Flags[] {
        return Object.freeze([
            Flags.BACKUP_CREATE,
            Flags.BACKUP_READ,
            Flags.BACKUP_UPDATE,
            Flags.BACKUP_DELETE,
        ]);
    }

    /** @returns All the server allocation permissions. */
    static get ALLOCATIONS(): readonly Flags[] {
        return Object.freeze([
            Flags.ALLOCATION_READ,
            Flags.ALLOCATION_CREATE,
            Flags.ALLOCATION_UPDATE,
            Flags.ALLOCATION_DELETE,
        ]);
    }

    /** @returns All the server startup permissions. */
    static get STARTUPS(): readonly Flags[] {
        return Object.freeze([Flags.STARTUP_READ, Flags.STARTUP_UPDATE]);
    }

    /** @returns All the server database permissions. */
    static get DATABASES(): readonly Flags[] {
        return Object.freeze([
            Flags.DATABASE_CREATE,
            Flags.DATABASE_READ,
            Flags.DATABASE_UPDATE,
            Flags.DATABASE_DELETE,
            Flags.DATABASE_VIEW_PASSWORD,
        ]);
    }

    /** @returns All the server schedule permissions. */
    static get SCHEDULES(): readonly Flags[] {
        return Object.freeze([
            Flags.SCHEDULE_CREATE,
            Flags.SCHEDULE_READ,
            Flags.SCHEDULE_UPDATE,
            Flags.SCHEDULE_DELETE,
        ]);
    }

    /** @returns All the server settings permissions. */
    static get SETTINGS(): readonly Flags[] {
        return Object.freeze([Flags.SETTINGS_RENAME, Flags.SETTINGS_REINSTALL]);
    }

    /** @returns The admin permissions. */
    static get ADMIN(): readonly Flags[] {
        return Object.freeze([
            Flags.ADMIN_WEBSOCKET_ERRORS,
            Flags.ADMIN_WEBSOCKET_INSTALL,
            Flags.ADMIN_WEBSOCKET_TRANSFER,
        ]);
    }

    /** The string permission value. */
    public value: string[];

    /**
     * @param perms The data to resolve permissions from.
     */
    constructor(...perms: string[]) {
        this.value = Permissions.resolve(...perms);
    }

    /**
     * Resolves a permissions object from a specified source.
     * @param perms The permissions to resolve.
     * @returns The resolved permissions.
     */
    static resolve(...perms: string[]): string[] {
        const res: string[] = [];
        const values = Object.values<string>(Flags);

        if (perms.some((p) => p === '*')) return values;
        for (const p of perms) {
            if (p in Flags || values.includes(p)) {
                res.push(p);
            } else {
                throw new Error(`unknown permission '${p}'`);
            }
        }

        return res;
    }

    /**
     * @param perms The permissions to check for.
     * @returns True if the current value has any of the specified permissions.
     */
    hasAny(...perms: string[]): boolean {
        const res = Permissions.resolve(...perms);
        return res.some((p) => this.value.includes(p));
    }

    /**
     * @param perms The permissions to check for.
     * @returns True if the current value has all of the specified permissions.
     */
    hasAll(...perms: string[]): boolean {
        const res = Permissions.resolve(...perms);
        return res.every((p) => this.value.includes(p));
    }

    /**
     * @returns True if the current value includes administrative permissions.
     */
    isAdmin(): boolean {
        return this.value.some((p: Flags) =>
            [
                Flags.ADMIN_WEBSOCKET_ERRORS,
                Flags.ADMIN_WEBSOCKET_INSTALL,
                Flags.ADMIN_WEBSOCKET_TRANSFER,
            ].includes(p),
        );
    }

    /**
     * Adds the specified permissions to the current value.
     * @param perms The permissions to add.
     * @returns The updated permissions instance.
     */
    add(...perms: string[]): this {
        this.value = this.value.concat(Permissions.resolve(...perms));
        return this;
    }

    /**
     * Removes the specified permissions from the current value.
     * @param perms The permissions to remove.
     * @returns The updated permissions instance.
     */
    remove(...perms: string[]): this {
        const res = Permissions.resolve(...perms);
        this.value = this.value.filter((p) => !res.includes(p));
        return this;
    }

    /**
     * @returns An object with all the permissions having `true` or `false`
     * values if they are currently present.
     */
    serialize(): Record<string, boolean> {
        const res: Record<string, boolean> = {};
        for (let [k, v] of Object.entries(Flags))
            res[k] = this.value.includes(v);

        return res;
    }
}
