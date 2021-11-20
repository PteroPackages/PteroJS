// Typedefs for PteroJS classes and structures

import EventEmitter from 'events';
import WebSocket from 'ws';

export const version: string;

export interface Allocation {
    id:        number;
    ip:        string;
    ipAlias:   string|null;
    port:      number;
    notes:     string|null;
    isDefault: boolean;
}

export class AllocationManager {
    public constructor(client: PteroApp|PteroClient, server: ApplicationServer|ClientServer, data: object);

    public client: PteroApp|PteroClient;

    public _patch(data: object): Allocation|Set<Allocation>;
    public fetch(): Promise<Set<Allocation>>;
    public assign(): Promise<unknown>;
    public setNote(id: number, note: string): Promise<Allocation>;
    public setPrimary(id: number): Promise<unknown>;
    public unassign(id: number): Promise<void>;
}

export class ApplicationRequestManager {
    public constructor(client: PteroApp);

    public client: PteroApp;
    public suspended: boolean;
    public headers: { [key: string]: string };

    public make(path: string, params?: object, method?: string): Promise<object|void>;
    public ping(): Promise<boolean>;
}

export class ApplicationServerManager {
    public constructor(client: PteroApp);

    public client: PteroApp;
    public cache: Dict<number, ApplicationServer>;
    public static get defaultLimits(): object;
    public static get defaultFeatureLimits(): object;

    public _patch(data: object): ApplicationServer|Dict<number, ApplicationServer>;
    public resolve(obj: string|number|object|ApplicationServer): ApplicationServer|null;
    public fetch(id?: number, options?:{ force?: boolean; include?: string[] }): Promise<ApplicationServer>;
    public query(entity: string, filter?: string, sort?: 'id'|'-id'|'uuid'|'-uuid'): Promise<Dict<number, ApplicationServer>>;
    public create(
        user: number|PteroUser,
        options:{
                name: string;
                egg: string;
                image: string;
                startup: string;
                env: object;
                allocation: number;
                limits?: object;
                featureLimits?: object;
            }
    ): Promise<ApplicationServer>;
    public delete(server: number|ApplicationServer, force?: boolean): Promise<boolean>;
    }

export class ApplicationServer {
    public constructor(client: PteroApp, data: object);

    public client: PteroApp;
    public id: number;
    public externalId: string|null;
    public uuid: string;
    public identifier: string;
    public name: string;
    public description: string|null;
    public suspended: boolean;
    public limits: object;
    public featureLimits: object;
    public user: number;
    public owner: PteroUser|null;
    public nodeId: number;
    public allocation: number;
    public nest: number;
    public egg: number;
    public createdAt: Date;
    public createdTimestamp: number;
    public updatedAt: Date|null;
    public updatedTimestamp: number|null;

    public _patch(data: object): ApplicationServer|Dict<number, ApplicationServer>;
    public updateDetails(options: object): Promise<this>;
    public suspend(): Promise<void>;
    public unsuspend(): Promise<void>;
    public reinstall(): Promise<void>;
    public toJSON(): object;
}

export interface Backup {
    uuid:         string;
    name:         string;
    ignoredFiles: unknown[];
    hash:         string|null;
    bytes:        number;
    createdAt:    Date;
    completedAt:  Date|null;
}

export class BackupManager {
    public constructor(client: PteroApp|PteroClient, server: ApplicationServer);

    public client: PteroApp;
    public cache: Dict<string, Backup>;

    public _patch(data: object): Backup|Dict<string, Backup>;
    public fetch(id?: string, force?: boolean): Promise<Backup|Dict<string, Backup>>;
    public create(): Promise<Backup>;
    public download(id: string): Promise<string>;
    public delete(id: string): Promise<boolean>;
}

export class BaseUser {
    public constructor(client: PteroApp|PteroClient, data: object);

    public client: PteroApp|PteroClient;
    public id: number;
    public username: string;
    public email: string;
    public firstname: string;
    public lastname: string;
    public language: string;

    public _patch(data: object): void;
    public toString(): string;
    public toJSON(): object;
}

export class ClientRequestManager {
    public constructor(client: PteroClient);

    public client: PteroClient;
    public suspended: boolean;
    public headers: { [key: string]: string };

    public make(path: string, params?: object, method?: string): Promise<object|void>;
    public ping(): Promise<boolean>;
}

export class ClientServer {
    public constructor(client: PteroClient, data: object);

    public client: PteroClient;

    public isOwner: boolean;
    public identifier: string;
    public uuid: string;
    public name: string;
    public node: string;
    public sftp:{
        ip: string;
        port: number;
    };
    public description: string | null;
    public limits: object;
    public featureLimits: object;
    public state: string;
    public installing: boolean;
    public users: SubUserManager;
    public allocations: AllocationManager;
    public permissions: Permissions;
    public databases: DatabaseManager;
    public files: FileManager;
    public schedules: Dict<number, Schedule>|null;

    public _patch(data: object): void;
    public addWebSocket(): void;
    public sendCommand(command: string): Promise<void>;
    public setPowerState(state: 'start'|'stop'|'restart'|'kill'): Promise<void>;
}

export interface PageData {
    current:    number;
    total:      number;
    count:      number;
    perPage:    number;
    totalPages: number;
    links:      object;
}

export class ClientServerManager {
    public constructor(client: PteroClient);

    public client: PteroClient;
    public cache: Dict<string, ClientServer>;
    public pageData: PageData;

    public _patch(data: object): ClientServer|Dict<string, ClientServer>;
    public _resolveMeta(data: object): void;
    public fetch(id?: string, options?:{ force?: boolean; include?: string[] }): Promise<ClientServer|Dict<string, ClientServer>>;
}

export interface APIKey {
    identifier:  string;
    description: string;
    allowedIPs:  string[];
    lastUsedAt:  Date|null;
    createdAt:   Date;
}

export class ClientUser extends BaseUser {
    public constructor(client: PteroClient, data: object);

    public client: PteroClient;
    public isAdmin: boolean;
    public tokens: string[];
    public apikeys: APIKey[];

    public get2faCode(): Promise<string>;
    public enable2fa(code: string): Promise<string[]>;
    public disable2fa(password: string): Promise<void>;
    public updateEmail(email: string, password: string): Promise<this>;
    public updatePassword(oldpass: string, newpass: string): Promise<void>;
    public fetchKeys(): Promise<APIKey[]>;
    public createKey(description: string, allowed?: string[]): Promise<APIKey>;
    public deleteKey(id: string): Promise<void>;
}

export interface Database {
    id:             string;
    host:{
        address:    string;
        port:       number;
    };
    name:           string;
    password:       string|null;
    connections:    string;
    maxConnections: number;
}

export class DatabaseManager {
    public constructor(client: PteroApp|PteroClient, server: ApplicationServer|ClientServer, data: object);

    public client: PteroApp|PteroClient;
    public isClient: boolean;
    public cache: Dict<string, Database>;

    public _patch(data: object): Database|Dict<string, Database>;
    public fetch(withPass?: boolean): Promise<Database|Dict<string, Database>|void>;
    public create(database: string, remote: string): Promise<Database|void>;
    public rotate(id: string): Promise<Database|void>;
    public delete(id: string): Promise<boolean|void>;
}

export interface DictConstructor {
    new (): Dict<any, any>;
    new <key, value>(entries?: Array<readonly [key, value]>): Dict<key, value>;
    new <key, value>(iterable?: Iterable<readonly [key, value]>): Dict<key, value>;
    readonly [Symbol.species]: DictConstructor;
}

export class Dict<K, V> extends Map<K, V> {
    public ['constructor']: DictConstructor;

    public has(key: K): boolean;
    public get(key: K): V|undefined;
    public set(key: K, value: V): this;
    public delete(key: K): boolean;

    public some(fn: (value: V, key: K, dict: this) => boolean): boolean;
    public every(fn: (value: V, key: K, dict: this) => boolean): boolean;
    public hasAny(...keys: K[]): boolean;
    public hasAll(...keys: K[]): boolean;

    public first(amount?: number): V|V[]|undefined;
    public last(amount?: number): V|V[]|undefined;
    public random(amount?: number): V|V[]|undefined;

    public map<T>(fn: (value: V, key: K, dict: this) => T): T[];
    public filter(fn: (value: V, key: K, dict: this) => boolean): Dict<K, V>;
    public filter<k extends K>(fn: (value: V, key: K, dict: this) => key is k): Dict<k, V>;
    public filter<v extends V>(fn: (value: V, key: K, dict: this) => value is v): Dict<K, v>;
    public filter<k extends K, v extends V>(fn: (value: V, key: K, dict: this) => k): Dict<k, v>;
    public find(fn: (value: V, key: K, dict: this) => boolean): V|undefined;
    public find<v extends V>(fn: (value: V, key: K, dict: this) => value is v): v|undefined;
    public sweep(fn: (value: V, key: K, dict: this) => boolean): number;
    public part(fn: (value: V, key: K, dict: this) => boolean): Dict<K, V>[];
    public part<k extends K>(fn: (value: V, key: K, dict: this) => key is k): Dict<k, V>[];
    public part<v extends V>(fn: (value: V, key: K, dict: this) => value is v): Dict<K, v>[];

    public reduce<T>(fn: (value: V, key: K, dict: this) => boolean, acc: T): T;
    public join(...dict: Dict<K, V>[]): Dict<K, V>;
    public difference(dict: Dict<K, V>): Dict<K, V>;
}

export class RequestError extends Error {
    public constructor(message: string);
}

export class PteroAPIError extends Error {
    public constructor(message: object);

    public code: string;
}

export class WebSocketError extends Error {
    public constructor(message: string);
}

export interface PteroFile {
    name:        string;
    mode:        string;
    modeBits:    bigint;
    size:        number;
    isFile:      boolean;
    isSymlink:   boolean;
    isEditable?: boolean;
    mimetype:    string;
    createdAt:   Date;
    modifiedAt:  Date|null;
}

export class FileManager {
    public constructor(client: PteroApp|PteroClient, server: ApplicationServer|ClientServer, data: object);

    public client: PteroApp|PteroClient;
    public server: ApplicationServer|ClientServer;
    public isClient: boolean;
    public cache: Map<string, Map<string, PteroFile>>;

    public _patch(data?: object): PteroFile|Map<string, PteroFile>;
    public fetch(dir?: string): Promise<Map<string, PteroFile>|void>;
    public getContents(filePath: string): Promise<string|void>;
    public download(filePath: string): Promise<string|void>;
    public rename(filePath: string, name: string): Promise<void>;
    public copy(filePath: string): Promise<void>;
    public write(filePath: string, content: string|Buffer): Promise<void>;
    public compress(dir: string, files: string[]): Promise<Map<string, PteroFile>|void>;
    public decompress(dir: string, file: string): Promise<void>;
    public delete(dir: string, files: string[]): Promise<void>;
    public createFolder(dir: string, name: string): Promise<void>;
    public getUploadURL(): Promise<string|void>;
}

export interface Nest {
    id:          number;
    uuid:        string;
    author:      string;
    name:        string;
    description: string;
    createdAt:   Date;
    updatedAt:   Date|null;
}

export class NestManager {
    public constructor(client: PteroApp);

    public client: PteroApp;
    public cache: Set<Nest>;
    // public eggs

    public _patch(data: object): Set<Nest>;
    public fetch(id?: number): Promise<Set<Nest>>;
}

export class Node {
    public constructor(client: PteroApp, data: object);

    public client: PteroApp;
    public id: number;
    public uuid: string;
    public public: boolean; // cursed
    public name: string;
    public description: string|null;
    public locationId: number;
    public location: NodeLocation|null;
    public servers: Map<number, ApplicationServer>|null;
    public fqdn: string;
    public scheme: string;
    public behindProxy: boolean;
    public maintenance: string;
    public memory: number;
    public overallocatedMemory: number;
    public overallocatedDisk: number;
    public uploadSize: number;
    public daemon:{
        listening: string;
        sftp: string;
        base: string;
    };
    public createdAt: Date;
    public updatedAt: Date|null;

    public _patch(data: string): void;
    public getConfig(): Promise<object>;
    public update(options:{
        name?: string;
        location?: number;
        fpdn?: string;
        scheme?: string;
        memory?: number;
        disk?: number;
        stfp?:{
            port: number;
            listener: string;
        };
        upload_size?: number;
        memory_overallocate?: number;
        disk_overallocate?: number;
    }): Promise<this>;
    public delete(): Promise<boolean>;
    public toJSON(): object;
}

export interface NodeLocation {
    id:        number;
    long:      string;
    short:     string;
    createdAt: Date;
    updatedAt: Date|null;
}

export class NodeLocationManager {
    public constructor(client: PteroApp);

    public client: PteroApp;
    public cache: Dict<number, NodeLocation>;

    public _patch(data: object): NodeLocation|Dict<number, NodeLocation>;
    public resolve(obj: number|object): NodeLocation|null;
    public fetch(id?: number, force?: boolean): Promise<NodeLocation|Dict<number, NodeLocation>>;
    public create(short: string, long: string): Promise<NodeLocation>;
    public update(id: number, options:{ short: string; long: string }): Promise<NodeLocation>;
    public delete(id: number): Promise<boolean>;
}

export class NodeManager {
    public constructor(client: PteroApp);

    public client: PteroApp;
    public cache: Dict<number, Node>;

    public _patch(data: object): Node|Dict<number, Node>;
    public fetch(id?: number, options?:{ force?: boolean; include?: string[] }): Promise<Node|Dict<number, Node>>;
    public create(options:{
        name: string;
        location: number;
        fqdn: string;
        scheme: string;
        memory: number;
        disk: number;
        sftp:{
            port: number;
            listener: string;
        };
        upload_size?: number;
        memory_overallocate?: number;
        disk_overallocate?: number;
    }): Promise<Node>;
    public update(options:{
        name?: string;
        location?: number;
        fpdn?: string;
        scheme?: string;
        memory?: number;
        disk?: number;
        stfp?:{
            port: number;
            listener: string;
        };
        upload_size?: number;
        memory_overallocate?: number;
        disk_overallocate?: number;
    }): Promise<Node>;
    public delete(node: number|Node): Promise<boolean>;
}

export type PermissionResolvable = string[]|number[]|object;

export interface PermissionFlags {
    WEBSOCKET_CONNECT: 0;

    CONTROL_CONSOLE: 1;
    CONTROL_START: 2;
    CONTROL_STOP: 3;
    CONTROL_RESTART: 4;

    USER_CREATE: 5;
    USER_READ: 6;
    USER_UPDATE: 7;
    USER_DELETE: 8;

    FILE_CREATE: 9;
    FILE_READ: 10;
    FILE_UPDATE: 11;
    FILE_DELETE: 12;
    FILE_ARCHIVE: 13;
    FILE_SFTP: 14;

    BACKUP_CREATE: 15;
    BACKUP_READ: 16;
    BACKUP_UPDATE: 17;
    BACKUP_DELETE: 18;

    ALLOCATION_READ: 19;
    ALLOCATION_CREATE: 20;
    ALLOCATION_UPDATE: 21;
    ALLOCATION_DELETE: 22;

    STARTUP_READ: 23;
    STARTUP_UPDATE: 24;

    DATABASE_CREATE: 25;
    DATABASE_READ: 26;
    DATABASE_UPDATE: 27;
    DATABASE_DELETE: 28;
    DATABASE_VIEW_PASSWORD: 29;

    SCHEDULE_CREATE: 30;
    SCHEDULE_READ: 31;
    SCHEDULE_UPDATE: 32;
    SCHEDULE_DELETE: 33;

    SETTINGS_RENAME: 34;
    SETTINGS_REINSTALL: 35;

    '*': 40;
    ADMIN_WEBSOCKET_ERRORS: 41;
    ADMIN_WEBSOCKET_INSTALL: 42;
    ADMIN_WEBSOCKET_TRANSFER: 43;
}

export class Permissions {
    public constructor(data: PermissionResolvable);

    public raw: object;

    public static get FLAGS(): Readonly<PermissionFlags>;
    public static get DEFAULT(): Readonly<PermissionFlags>;

    public has(perms: string|number|PermissionResolvable): boolean;
    public isAdmin(): boolean;
    public static resolve(perms: PermissionResolvable): { [key: string]: number };
    public serialize(): { [key: string]: boolean };
    public toArray(): string[];
    public toStrings(): string[];
    public static fromStrings(perms: string[]): { [key: string]: number };
}

export interface ApplicationOptions {
    fetchUsers:     boolean;
    fetchNodes:     boolean;
    fetchNests:     boolean;
    fetchServers:   boolean;
    fetchLocations: boolean;
    cacheUsers:     boolean;
    cacheNodes:     boolean;
    cacheNests:     boolean;
    cacheServers:   boolean;
    cacheLocations: boolean;
}

export class PteroApp {
    public constructor(domain: string, auth: string, options?: Partial<ApplicationOptions>);

    public domain: string;
    public auth: string;
    public options: ApplicationOptions;
    public readyAt: Date|null;
    public ping: number|null;
    public users: UserManager;
    public nodes: NodeManager;
    public nests: NestManager;
    public servers: ApplicationServerManager;
    public locations: NodeLocationManager;
    public requests: ApplicationRequestManager;

    public connect(): Promise<boolean>;
}

export interface ClientOptions {
    ws:            boolean;
    fetchClient:   boolean;
    fetchServers:  boolean;
    cacheServers:  boolean;
    cacheSubUsers: boolean;
    disableEvents: string[];
}

export interface ClientEvents {
    debug:            [message: string];
    ready:            [];
    serverConnect:    [server: ClientServer];
    serverOutput:     [data: string];
    serverDisconnect: [server: string];
    statusUpdate:     [status: string];
    statsUpdate:      [stats: object];
}

export class PteroClient extends EventEmitter {
    public constructor(domain: string, auth: string, options?: Partial<ClientOptions>);

    public domain: string;
    public auth: string;
    public options: ClientOptions;
    public readyAt: Date | null;
    public ping: number | null;
    public user: ClientUser|null;
    public servers: ClientServerManager;
    public schedules: ScheduleManager;
    public requests: ClientRequestManager;
    public ws: WebSocketManager;

    public emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
    public on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => any): this;
    public once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => any): this;
    public off<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => any): this;
}

export class PteroSubUser extends BaseUser {
    public constructor(client: PteroClient, data: object);

    public client: PteroClient;
    public readonly _server: string;
    public uuid: string;
    public image: string;
    public enabled: boolean;
    public createdAt: Date;
    public createdTimestamp: number;
    public permissions: Permissions;

    public override _patch(data: object): void;
    public setPermissions(perms: PermissionResolvable): Promise<this>;
}

export class PteroUser extends BaseUser {
    public constructor(client: PteroApp|PteroClient, data: object);

    public client: PteroApp|PteroClient;
    public externalId: string;
    public uuid: string;
    public isAdmin: boolean;
    public tfa: string;
    public createdAt: Date;
    public updatedAt: Date|null;
    public relationships: Dict<number, ApplicationServer>|null;

    public override _patch(data: object): void;
    public update(options:{
        email?: string;
        username?: string;
        firstname?: string;
        lastname?: string;
        password: string;
    }): Promise<this>;
    public delete(): Promise<boolean>;
}

export type ScheduleAction =
    | 'command'
    | 'power'
    | 'backup';

export interface ScheduleTask {
    id:         number;
    sequenceId: number;
    action:     ScheduleAction;
    payload:    string;
    offset:     number;
    queued:     boolean;
    createdAt:  Date;
    updatedAt:  Date | null;
}

export class Schedule {
    public constructor(client: PteroClient, serverId: string, data: object);

    public client: PteroClient;
    public serverId: string;
    public tasks: Dict<number, ScheduleTask>;

    public readonly id: number;
    public name: string;
    public cron: { [key: string]: string }
    public active: boolean;
    public processing: boolean;
    public lastRunAt: Date | null;
    public nextRunAt: Date;
    public readonly createdAt: Date;
    public updatedAt: Date | null;

    public update(options:{
        name?: string;
        active?: boolean;
        minute?: string;
        hour?: string;
        dayOfWeek?: string;
        dayOfMonth?: string;
    }): Promise<this>;
    public createTask(action: ScheduleAction, payload: string, offset: number): Promise<ScheduleTask>;
    public updateTask(
        id: number,
        options:{
            action?: ScheduleAction;
            payload?: string;
            offset?: number;
        }
    ): Promise<ScheduleTask>;
    public deleteTask(id: number): Promise<boolean>;
    public delete(): Promise<boolean>;
}

export class ScheduleManager {
    public constructor(client: PteroClient);

    public client: PteroClient;
    public cache: Dict<string, Dict<number, Schedule>>;

    public _patch(id: number, data: object): Schedule|Dict<number, Schedule>;
    public fetch(server: string, id: number, force?: boolean): Promise<Schedule|Dict<number, Schedule>>;
    public create(
        server: string,
        options:{
            name: string;
            active: boolean;
            minute: string;
            hour: string;
            dayOfWeek?: string;
            dayOfMonth?: string;
        }
    ): Promise<Schedule>;
    public update(
        server: string,
        id: number,
        options:{
            name?: string;
            active?: boolean;
            minute?: string;
            hour?: string;
            dayOfWeek?: string;
            dayOfMonth?: string;
        }
    ): Promise<Schedule>;
    public delete(server: string, id: number): Promise<boolean>;
}

export class SubUserManager {
    public constructor(client: PteroClient, server: ClientServer);

    public client: PteroClient;
    public cache: Dict<string, PteroSubUser>;

    public _patch(data: object): PteroSubUser|Dict<string, PteroSubUser>;
    public resolve(obj: string|number|object|PteroSubUser): PteroSubUser|null;
    public fetch(id?: string, force?: boolean): Promise<PteroSubUser|Dict<string, PteroSubUser>>;
    public add(email: string, permissions: PermissionResolvable): Promise<PteroSubUser>;
    public setPermissions(uuid: string, permissions: PermissionResolvable): Promise<PteroSubUser>;
    public remove(id: string): Promise<boolean>;
}

export class UserManager {
    public constructor(client: PteroApp);

    public client: PteroApp;
    public cache: Dict<number, PteroUser>;

    public _patch(data: object): PteroUser|Dict<number, PteroUser>;
    public resolve(obj: string|number|object|PteroUser): PteroUser|null;
    public fetch(id?: number, options?:{ force?: boolean; withServers?: boolean }): Promise<PteroUser|Dict<number, PteroUser>>;
    public fetchExternal(id: number, options?:{ force?: boolean; withServers?: boolean }): Promise<PteroUser>;
    public query(entity: string, filter?: string, sort?: string): Promise<Dict<number, PteroUser>>;
    public create(email: string, username: string, firstname: string, lastname: string): Promise<PteroUser>;
    public update(
        user: number|PteroUser,
        options:{
            email?: string;
            username?: string;
            firstname?: string;
            lastname?: string;
            password: string;
        }
    ): Promise<PteroUser>;
    public delete(user: number|PteroUser): Promise<boolean>;
}

export class WebSocketManager {
    public constructor(client: PteroClient);

    public client: PteroClient;
    public servers: string[];
    public status: string;
    public sockets: Map<string, WebSocket>;
    public lastPing: number;

    public connect(): Promise<boolean>;
    public send(id: string, event: string, data: any): void;
}

// Extensions

export interface StatusOptions {
    domain:        string;
    auth:          string;
    nodes:         number[];
    callInterval:  number;
    nextInterval?: number;
    retryLimit?:   number;
}

export interface StatusEvents {
    debug:      [message: string];
    connect:    [id: number];
    interval:   [node: object];
    disconnect: [id: number];
}

export class NodeStatus extends EventEmitter {
    public constructor(options: StatusOptions);

    public headers: { [key: string]: string };
    private interval: NodeJS.Timer | null;
    private connected: Set<number>;
    public domain: string;
    public auth: string;
    public nodes: number[];
    public callInterval: number;
    public nextInterval: number;
    public retryLimit: number;

    public onConnect: Function | null;
    public onInterval: Function | null;
    public onDisconnect: Function | null;

    public ping: number;
    public current: number;
    public readyAt: number;

    #debug(message: string): void;
    public connect(): Promise<void>;
    #ping(): Promise<void>;
    #handleNext(): Promise<void>;
    #request(id: number): Promise<void>;
    public close(message?: string, error?: boolean): void;

    public emit<E extends keyof StatusEvents>(event: E, ...args: StatusEvents[E]): boolean;
    public on<E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => any): this;
    public once<E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => any): this;
    public off<E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => any): this;
}
