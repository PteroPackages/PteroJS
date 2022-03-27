// Typedefs for PteroJS classes, structures and extensions

import { EventEmitter } from 'events';
import WebSocket from 'ws';

export interface FetchOptions {
    force?: boolean;
}

export type Include<B> = { include?: string[] } & B;

export interface OptionSpec {
    fetch:  boolean;
    cache:  boolean;
    max:    boolean;
}

// Application API

export interface ApplicationServerCreateOptions {
    name:           string;
    egg:            string;
    image:          string;
    startup:        string;
    env:            { [key: string]: any };
    allocation:     number;
    limits?:        { [key: string]: any };
    featureLimits?: { [key: string]: any };
}

export class ApplicationServerManager {
    static get FILTERS(): Readonly<string[]>;
    static get INCLUDES(): Readonly<string[]>;
    static get SORTS(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;

    get defaultLimits(): { [key: string]: number };
    get defaultFeatureLimits(): { [key: string]: number };

    _patch(data: any): ApplicationServer | Dict<number, ApplicationServer>;
    resolve(obj: string | number | object | ApplicationServer): ApplicationServer | undefined;
    panelURLFor(server: string | ApplicationServer): string;
    adminURLFor(server: number | ApplicationServer): string;
    fetch(id?: number, options?: Include<FetchOptions>): Promise<ApplicationServer | Dict<number, ApplicationServer>>;
    query(entity: string, filter?: string, sort?: string): Promise<Dict<number, ApplicationServer>>;
    create(user: number | PteroUser, options: ApplicationServerCreateOptions): Promise<ApplicationServer>;
    delete(server: number | ApplicationServer, force?: boolean): Promise<boolean>;
}

export class NestEggsManager {
    static get INCLUDES(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;
    cache: Dict<number, object>;

    adminURLFor(id: number): string;
    fetch(nest: number, id?: number, options?: Include<FetchOptions>): Promise<Dict<number, object>>;
    for(nest: number): object[];
}

export interface Nest {
    id:             number;
    uuid:           string;
    author:         string;
    name:           string;
    description:    string;
    createdAt:      Date;
    updatedAt:      Date | null;
}

export class NestManager {
    static get INCLUDES(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;
    cache: Set<Nest>;
    eggs: NestEggsManager;

    _patch(data: any): Set<Nest>;
    adminURLFor(id: number): string;
    fetch(id: number, include: Include<{}>): Promise<Set<Nest>>;
}

export interface NodeAllocation {
    id:         number;
    ip:         string;
    alias:      string | null;
    port:       number;
    notes:      string | null;
    assigned:   boolean;
}

export class NodeAllocationManager {
    static get INCLUDES(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;
    cache: Dict<number, NodeAllocation>;

    _patch(node: number, data: any): Dict<number, NodeAllocation>;
    adminURLFor(id: number): string;
    fetch(node: number, options: Include<FetchOptions>): Promise<Dict<number, NodeAllocation>>;
    fetchAvailable(node: number, single?: boolean): Promise<Dict<number, NodeAllocation> | NodeAllocation | void>;
    create(node: number, ip: string, ports: string[]): Promise<void>;
    delete(node: number, id: number): Promise<boolean>;
}

export interface NodeLocation {
    id:         number;
    long:       string;
    short:      string;
    createdAt:  Date;
    updatedAt:  Date | null;
}

export class NodeLocationManager {
    static get FILTERS(): Readonly<string[]>;
    static get INCLUDES(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;
    cache: Dict<number, NodeLocation>;

    _patch(data: any): NodeLocation | Dict<number, NodeLocation>;
    resolve(obj: string | number | object): NodeLocation | undefined;
    adminURLFor(id: number): string;
    fetch(id?: number, options?: Include<FetchOptions>): Promise<NodeLocation | Dict<number, NodeLocation>>;
    query(entity: string, filter?: string, sort?: string): Promise<Dict<number, NodeLocation>>;
    create(short: string, long: string): Promise<NodeLocation>;
    update(id: number, options:{ short?: string; long?: string }): Promise<NodeLocation>;
    delete(id: number): Promise<boolean>;
}

export interface NodeCreateOptions {
    name:                   string;
    location:               number;
    fqdn:                   string;
    scheme:                 string;
    memory:                 number;
    disk:                   number;
    sftp:{
        port:               number;
        listener:           number;
    };
    upload_size?:           number;
    memory_overallocate?:   number;
    disk_overallocate?:     number;
}

export class NodeManager {
    static get FILTERS(): Readonly<string[]>;
    static get INCLUDES(): Readonly<string[]>;
    static get SORTS(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;
    cache: Dict<number, Node>;

    _patch(data: any): Node | Dict<number, Node>;
    resolve(obj: string | number | object | Node): Node | undefined;
    adminURLFor(node: number | Node): string;
    fetch(id: number, options?: Include<FetchOptions>): Promise<Node | Dict<number, Node>>;
    query(entity: string, filter?: string, sort?: string): Promise<Dict<number, Node>>;
    create(options: NodeCreateOptions): Promise<Node>;
    update(node: number | Node, options: Partial<NodeCreateOptions>): Promise<Node>;
    delete(node: number | Node): Promise<boolean>;
}

export interface ApplicationOptions {
    users?:     OptionSpec;
    nodes?:     OptionSpec;
    nests?:     OptionSpec;
    servers?:   OptionSpec;
    locations?: OptionSpec;
}

export class PteroApp {
    constructor(domain: string, auth: string, options?: ApplicationOptions);
    domain: string;
    auth: string;
    options: ApplicationOptions;
    users: UserManager;
    nodes: NodeManager;
    nests: NestManager;
    servers: ApplicationServerManager;
    locations: NodeLocationManager;
    allocations: NodeAllocationManager;
    requests: RequestManager;

    get ping(): number;

    connect(): Promise<boolean>;
}

export interface UserCreateOptions {
    email:      string;
    username:   string;
    firstname:  string;
    lastname:   string;
    password?:  string;
}

export class UserManager {
    static get FILTERS(): Readonly<string[]>;
    static get SORTS(): Readonly<string[]>;

    constructor(client: PteroApp);
    client: PteroApp;
    cache: Dict<number, PteroUser>;

    _patch(data: any): PteroUser | Dict<number, PteroUser>;
    resolve(obj: string | number | object | PteroUser): PteroUser | undefined;
    adminURLFor(user: number | PteroUser): string;
    fetch(id?: number, options?: { withServers?: boolean } & FetchOptions): Promise<PteroUser | Dict<number, PteroUser>>;
    fetchExternal(id: number, options?: { withServers?: boolean } & FetchOptions): Promise<PteroUser>;
    query(entity: string, filter?: string, sort?: string): Promise<Dict<number, PteroUser>>;
    create(email: string, username: string, firstname: string, lastname: string): Promise<PteroUser>;
    update(user: number | PteroUser, options: Partial<UserCreateOptions>): Promise<PteroUser>;
    delete(user: number | PteroUser): Promise<boolean>;
}

// Client API - Websockets

export interface WebSocketAuth {
    token:  string;
    socket: string;
}

export type WebSocketStatus =
    | 'CLOSED'
    | 'CONNECTING'
    | 'RECONNECTING'
    | 'CONNECTED';

export interface ShardCommands {
    'auth':         [token: string]
    'send stats':   []
    'send logs':    []
    'set state':    [state: PowerState]
    'send command': [command: string]
}

export interface ServerStats {
    cpuAbsolute:        number;
    diskBytes:          number;
    memoryBytes:        number;
    memoryLimitBytes:   number;
    network: {
        rxBytes:        number;
        txBytes:        number;
    };
    state:              string;
    uptime:             number;
}

export interface ShardEvents {
    debug:              [message: string];
    error:              [id: string, error: any];

    tokenRefresh:       [];

    authSuccess:        [];
    serverConnect:      [socket: WebSocket];
    serverOutput:       [output: string];
    serverDisconnect:   [];

    statusUpdate:       [status: string];
    statsUpdate:        [stats: ServerStats];
    transferUpdate:     [data: any];

    installStart:       [];
    installOutput:      [output: string];
    installComplete:    [];

    backupComplete:     [backup: Partial<Backup>];

    daemonMessage:      [message: any];
}

export class Shard extends EventEmitter {
    constructor(client: PteroClient, id: string, auth: WebSocketAuth);
    client: PteroClient;
    id: string;
    token: string | null;
    socket: WebSocket | null;
    status: WebSocketStatus;
    readyAt: number;
    ping: number;
    lastPing: number;

    #debug(message: string): void;
    connect(auth?: WebSocketAuth): Promise<WebSocket>;
    reconnect(): Promise<WebSocket>;
    refreshToken(): Promise<void>;
    disconnect(): Promise<void>;
    send<K extends keyof ShardCommands>(event: K, args: ShardCommands[K]): void;
    _onOpen(): void;
    _onMessage({ data }:{ data: string }): void;
    _onError({ error }: any): void;
    _onClose(): void;

    emit<E extends keyof ShardEvents>(event: E, ...args: ShardEvents[E]): boolean;
    on<E extends keyof ShardEvents>(event: E, listener: (...args: ShardEvents[E]) => any): this;
    on<T, E extends keyof ShardEvents>(event: E, listener: (...args: ShardEvents[E]) => T): this;
    once<E extends keyof ShardEvents>(event: E, listener: (...args: ShardEvents[E]) => any): this;
    once<T, E extends keyof ShardEvents>(events: E, listener: (...args: ShardEvents[E]) => T): this;
    off<E extends keyof ShardEvents>(event: E, listener: (...args: ShardEvents[E]) => any): this;
    off<T, E extends keyof ShardEvents>(event: E, listener: (...args: ShardEvents[E]) => T): this;
}

export class WebSocketManager {
    constructor(client: PteroClient);
    client: PteroClient;
    servers: string[];
    shards: Map<string, Shard>;
    totalShards: number;
    readyAt: number;
    ping: number;

    destroy(): void;
    createShard(id: string): Shard;
    removeShard(id: string): boolean;
}

// Client API - Main

export interface Backup {
    uuid:           string;
    name:           string;
    ignoredFiles:   string[];
    hash:           string | null;
    bytes:          number;
    createdAt:      Date;
    completedAt:    Date | null;
}

export class BackupManager {
    constructor(client: PteroClient, server: ClientServer);
    client: PteroClient;
    server: ClientServer;
    cache: Dict<string, Backup>;

    _patch(data: any): Backup | Dict<string, Backup>;
    fetch(id?: string, force?: boolean): Promise<Backup | Dict<string, Backup>>;
    create(): Promise<Backup>;
    download(id: string): Promise<string>;
    delete(id: string): Promise<boolean>;
}

export interface ClientDatabase {
    id:             string;
    host:{
        address:    string;
        port:       number;
    };
    name:           string;
    username:       string;
    password:       string | null;
    connections:    string;
    maxConnections: number;
}

export class ClientDatabaseManager {
    constructor(client: PteroClient, server: ClientServer);
    client: PteroClient;
    server: ClientServer;
    cache: Dict<string, ClientDatabase>;

    _patch(data: any): Dict<string, ClientDatabase>;
    get panelURL(): string;
    fetch(withPass?: boolean): Promise<Dict<string, ClientDatabase>>;
    create(database: string, remote: string): Promise<ClientDatabase>;
    rotate(id: string): Promise<ClientDatabase>;
    delete(id: string): Promise<boolean>;
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
    static get INCLUDES(): Readonly<string[]>;

    constructor(client: PteroClient);
    client: PteroClient;
    cache: Dict<string, ClientServer>;
    pageData: PageData;

    _patch(data: any): ClientServer | Dict<string, ClientServer>;
    _resolveMeta(data: any): void;
    panelURLFor(server: string | ClientServer): string;
    fetch(id: string, options?: Include<FetchOptions>): Promise<ClientServer | Dict<string, ClientServer>>;
}

export interface PteroFile {
    name:       string;
    mode:       string;
    modeBits:   bigint;
    size:       number;
    isFile:     boolean;
    isSymlink:  boolean;
    isEditable: boolean | undefined;
    mimetype:   string;
    createdAt:  Date;
    modifiedAt: Date | null;
}

export class FileManager {
    constructor(client: PteroClient, server: ClientServer);
    client: PteroClient;
    server: ClientServer;
    cache: Dict<string, Dict<string, PteroFile>>;

    _patch(data: any): Dict<string, PteroFile>;
    get panelURL(): string;
    fetch(dir: string): Promise<Dict<string, PteroFile>>;
    getContents(filePath: string): Promise<string>;
    download(filePath: string): Promise<string>;
    rename(filePath: string, name: string): Promise<void>;
    copy(filePath: string): Promise<void>;
    write(filePath: string, content: string | Buffer): Promise<void>;
    compress(dir: string, files: string[]): Promise<PteroFile>;
    decompress(dir: string, file: string): Promise<void>;
    delete(dir: string, files: string[]): Promise<void>;
    createFolder(dir: string, name: string): Promise<void>;
    getUploadURL(): Promise<string>;
}

export interface NetworkAllocation {
    id:         number;
    ip:         string;
    ipAlias:    string | null;
    port:       number;
    notes:      string | null;
    isDefault:  boolean;
}

export class NetworkAllocationManager {
    constructor(client: PteroClient, server: ClientServer);
    client: PteroClient;
    server: ClientServer;
    cache: Dict<number, NetworkAllocation>;

    _patch(data: any): Dict<number, NetworkAllocation>;
    fetch(): Promise<Dict<number, NetworkAllocation>>;
    assign(): Promise<NetworkAllocation>;
    setNote(id: number, notes: string): Promise<NetworkAllocation>;
    setPrimary(id: number): Promise<NetworkAllocation>;
    unassign(id: number): Promise<true>;
}

export interface ClientOptions {
    ws?:            boolean;
    fetchClient?:   boolean;
    servers?:       OptionSpec;
    subUsers?:      OptionSpec;
    disableEvents?: string[];
}

export interface ClientEvents {
    debug:            [message: string];
    error:            [id: string, error: any];
    ready:            [];
}

export class PteroClient extends EventEmitter {
    constructor(domain: string, auth: string, options?: ClientOptions);
    domain: string;
    auth: string;
    options: ClientOptions;
    user: ClientUser | null;
    servers: ClientServerManager;
    schedules: ScheduleManager;
    requests: RequestManager;
    ws: WebSocketManager;
    ping: number;

    connect(): Promise<boolean>;
    fetchClient(): Promise<ClientUser>;
    addSocketServer<T extends string | string[]>(ids: T): T extends string[] ? Shard[] : Shard;
    removeSocketServer(id: string): boolean;
    disconnect(): void;

    emit<E extends keyof ClientEvents>(event: E, ...args: ClientEvents[E]): boolean;
    on<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => any): this;
    on<T, E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => T): this;
    once<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => any): this;
    once<T, E extends keyof ClientEvents>(events: E, listener: (...args: ClientEvents[E]) => T): this;
    off<E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => any): this;
    off<T, E extends keyof ClientEvents>(event: E, listener: (...args: ClientEvents[E]) => T): this;
}

export interface ScheduleCreateOptions {
    name:           string;
    active:         boolean;
    minute:         string;
    hour:           string;
    dayOfWeek?:     string;
    dayOfMonth?:    string;
}

export class ScheduleManager {
    constructor(client: PteroClient);
    client: PteroClient;
    cache: Dict<number, Schedule>;

    _patch(id: number, data: any): Schedule | Dict<number, Schedule>;
    panelURLFor(id: string, schedule: string | Schedule): string;
    fetch(server: string, id?: string, force?: boolean): Promise<Schedule | Dict<number, Schedule>>;
    create(server: string, options: ScheduleCreateOptions): Promise<Schedule>;
    update(server: string, id: string, options: Partial<ScheduleCreateOptions>): Promise<Schedule>;
    delete(server: string, id: string): Promise<boolean>;
}

export class SubUserManager {
    constructor(client: PteroClient, server: ClientServer);
    client: PteroClient;
    server: ClientServer;
    cache: Dict<string, PteroSubUser>;

    _patch(data: any): PteroSubUser | Dict<string, PteroSubUser>;
    resolve(obj: string | number | object | PteroSubUser): PteroSubUser | undefined;
    get panelURL(): string;
    fetch(id?: string, force?: boolean): Promise<PteroSubUser | Dict<string, PteroSubUser>>;
    add(email: string, permissions: PermissionResolvable): Promise<PteroSubUser>;
    setPermissions(uuid: string, permissions: PermissionResolvable): Promise<PteroSubUser>;
    remove(id: string): Promise<boolean>;
}

// Extensions

export interface StatusOptions {
    domain:         string;
    auth:           string;
    nodes:          number[];
    callInterval:   number;
    nextInterval?:  number;
    retryLimit?:    number;
}

export interface StatusEvents {
    debug:      [message: string];
    connect:    [id: number];
    interval:   [node: object];
    disconnect: [id: number];
}

export class NodeStatus extends EventEmitter implements StatusOptions {
    constructor(options: StatusOptions);
    options: StatusOptions;
    headers: { [key: string]: string };
    #interval: NodeJS.Timer | null;
    #connected: Set<number>;
    domain: string;
    auth: string;
    nodes: number[];
    callInterval: number;
    nextInterval: number;
    retryLimit: number;
    ping: number;
    current: number;
    readyAt: number;

    onConnect: (id: number) => void;
    onInterval: (d: object) => void;
    onDisconnect: (id: number) => void;

    #debug(message: string): void;
    connect(): Promise<void>;
    #ping(): Promise<void>;
    #handleNext(): Promise<void>;
    #request(id: number): Promise<void>;
    close(message?: string, error?: boolean): void;

    emit<E extends keyof StatusEvents>(event: E, ...args: StatusEvents[E]): boolean;
    on<E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => any): this;
    on<T, E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => T): this;
    once<E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => any): this;
    once<T, E extends keyof StatusEvents>(events: E, listener: (...args: StatusEvents[E]) => T): this;
    off<E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => any): this;
    off<T, E extends keyof StatusEvents>(event: E, listener: (...args: StatusEvents[E]) => T): this;
}

// HTTP

export class RequestManager extends EventEmitter {
    constructor(type: string, domain: string, auth: string);
    type: string;
    domain: string;
    auth: string;
    ping: number;

    getHeaders(): { [key: string]: string };
    #debug(message: string): void;
    _make(path: string, params: object, method?: string): Promise<object | Buffer | void>;
    get(path: string): Promise<object | Buffer | void>;
    post(path: string, params: object): Promise<object | Buffer | void>;
    patch(path: string, params: object): Promise<object | Buffer | void>;
    put(path: string, params: object): Promise<object | Buffer | void>;
    delete(path: string, params?: object): Promise<object | Buffer | void>;
}

// Structures

export interface UpdateDetailsOptions {
    name?:          string;
    owner?:         number | PteroUser;
    externalId?:    string;
    description?:   string;
}

export interface UpdateBuildOptions {
    allocation?:        number;
    swap?:              number;
    memory?:            number;
    disk?:              number;
    cpu?:               number;
    threads?:           number | null;
    io?:                number;
    featureLimits?:{
        allocations?:   number;
        backups?:       number;
        databases?:     number;
    };
}

export class ApplicationServer {
    constructor(client: PteroApp, data: object);
    client: PteroApp;
    id: number;
    uuid: string;
    identifier: string;
    externalId: string | null;
    name: string;
    description: string | null;
    suspended: boolean;
    limits: object;
    featureLimits: object;
    ownerId: number;
    owner: PteroUser | null;
    nodeId: number;
    node: Node | null;
    allocation: number;
    nest: number;
    egg: number;
    container: null;
    createdAt: Date;
    createdTimestamp: number;
    updatedAt: Date | null;
    updatedTimestamp: number | null;

    _patch(data: any): void;
    get panelURL(): string;
    get adminURL(): string;
    fetchOwner(): Promise<PteroUser>;
    updateDetails(options: UpdateDetailsOptions): Promise<this>;
    updateBuild(options: UpdateBuildOptions): Promise<this>;
    updateStartup(options: object): void;
    suspend(): Promise<void>;
    unsuspend(): Promise<void>;
    reinstall(): Promise<void>;
    delete(force?: boolean): Promise<boolean>;
    toJSON(): object;
}

export type PowerState =
    | 'start'
    | 'stop'
    | 'restart'
    | 'kill';

export class ClientServer {
    constructor(client: PteroClient, data: any);
    client: PteroClient;
    uuid: string;
    identifier: string;
    isOwner: boolean;
    name: string;
    node: number;
    stfp:{
        ip: string;
        port: number;
    };
    description: string | null;
    limits: object;
    featureLimits: object;
    suspended: boolean;
    state: string;
    installing: boolean;
    users: SubUserManager;
    allocations: NetworkAllocationManager;
    permissions: Permissions;
    databases: ClientServerManager;
    files: FileManager;
    schedules: Dict<string, Schedule>;

    _patch(data: any): void;
    get panelURL(): string;
    addWebsocket(): void;
    fetchResouces(): void;
    sendCommand(command: string): Promise<void>;
    setPowerState(state: PowerState): Promise<void>;
}

export interface DictConstructor {
    new(): Dict<any, any>;
    new<K, V>(entries?: readonly [K, V][]): Dict<K, V>;
    new<K, V>(iterable?: Iterable<readonly [K, V]>): Dict<K, V>;
    readonly [Symbol.iterator]: DictConstructor;
    readonly [Symbol.species]: DictConstructor;
}

export class Dict<K, V> extends Map<K, V> {
    ['constructor']: DictConstructor;

    has(key: K): boolean;
    get(key: K): V | undefined;
    set(key: K, value: V): this;
    delete(key: K): boolean;

    some(fn: (value: V, key: K, dict: this) => boolean): boolean;
    every(fn: (value: V, key: K, dict: this) => boolean): boolean;
    hasAny(...keys: K[]): boolean;
    hasAll(...keys: K[]): boolean;

    first(amount?: number): V | V[] | undefined;
    last(amount?: number): V | V[] | undefined;
    random(amount?: number): V | V[] | undefined;

    map<T>(fn: (value: V, key: K, dict: this) => T): T[];
    filter(fn: (value: V, key: K, dict: this) => boolean): Dict<K, V>;
    filter<k extends K>(fn: (value: V, key: K, dict: this) => key is k): Dict<K, V>;
    filter<v extends V>(fn: (value: V, key: K, dict: this) => value is v): Dict<K, v>;
    filter<k extends K, v extends V>(fn: (value: V, key: K, dict: this) => k): Dict<k, v>;
    filter<k extends K, v extends V>(fn: (value: V, key: K, dict: this) => v): Dict<k, v>;
    find(fn: (value: V, key: K, dict: this) => boolean): V | undefined;
    find<k extends K>(fn: (value: V, key: K, dict: this) => key is k): V | undefined;
    find<v extends V>(fn: (value: V, key: K, dict: this) => value is v): V | undefined;
    sweep(fn: (value: V, key: K, dict: this) => boolean): number;
    part(fn: (value: V, key: K, dict: this) => boolean): Dict<K, V>[];
    part<k extends K>(fn: (value: V, key: K, dict: this) => key is k): Dict<k, V>[];
    part<v extends V>(fn: (value: V, key: K, dict: this) => value is v): Dict<K, v>[];

    reduce<T>(fn: (value: V, key: K, dict: this) => boolean, acc: T): T;
    join(...dicts: Dict<K, V>[]): Dict<K, V>;
    difference(dict: Dict<K, V>): Dict<K, V>;
}

export class RequestError extends Error {
    constructor(message: string);
}

export class PteroAPIError extends Error {
    constructor(data: any);
    code: string;
}

export class WebSocketError extends Error {
    constructor(message: string);
}

export interface NodeUpdateOptions {
    name?:                  string;
    location?:              string;
    fqdn?:                  string;
    scheme?:                string;
    memory?:                number;
    disk?:                  number;
    sftp?:{
        port?:              number;
        listener?:          number;
    };
    upload_size?:           number;
    memory_overallocate?:   number;
    disk_overallocate?:     number;
}

export class Node {
    constructor(client: PteroApp, data: any);
    client: PteroApp;
    id: number;
    uuid: string;
    public: boolean;
    name: string;
    description: string | null;
    locationId: number;
    location: NodeLocation | undefined;
    servers: Dict<number, ApplicationServer> | undefined;
    fqdn: string;
    scheme: string;
    behindProxy: boolean;
    maintenance: boolean;
    memory: number;
    overallocatedMemory: number;
    disk: number;
    overallocatedDisk: number;
    uploadSize: number;
    daemon:{
        listening: number;
        sftp: number;
        base: string;
    };
    createdAt: Date;
    updatedAt: Date | null;

    _patch(data: any): void;
    get adminURL(): string;
    getConfig(): Promise<object>;
    update(options: NodeUpdateOptions): Promise<Node>;
    delete(): Promise<boolean>;
    toJSON(): object;
}

export type PermissionFlags = { [key: string]: number };
export type PermissionResolvable =
    | string[]
    | number[]
    | object;

export class Permissions {
    static get FLAGS(): Readonly<PermissionFlags>;
    static get DEFAULT(): Readonly<PermissionFlags>;

    constructor(data: PermissionResolvable);
    raw: PermissionFlags;

    has(perms: string | number | PermissionResolvable): boolean;
    isAdmin(): boolean;
    static resolve(perms: PermissionResolvable): PermissionFlags;
    serialize(): { [key: string]: boolean };
    toArray(): string[];
    toStrings(): string[];
    static fromStrings(perms: string[]): PermissionFlags;
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

export interface ScheduleUpdateOptions {
    name?:          string;
    active?:        boolean;
    minute?:        string;
    hour?:          boolean;
    dayOfWeek?:     boolean;
    dayOfMonth?:    boolean;
}

export class Schedule {
    constructor(client: PteroClient, serverId: string, data: any);
    client: PteroClient;
    serverId: string;
    tasks: Dict<number, ScheduleTask>;
    id: number;
    name: string;
    cron:{
        week: string;
        month: string;
        hour: string;
        minute: string;
    };
    active: boolean;
    processing: boolean;
    lastRunAt: Date | null;
    nextRunAt: Date;
    createdAt: Date;
    updatedAt: Date | null;

    _patch(data: any): void;
    _resolveTask(data: any): ScheduleTask;
    get panelURL(): string;
    update(options: ScheduleUpdateOptions): Promise<Schedule>;
    createTask(action: string, payload: string, offset: string): Promise<ScheduleTask>;
    updateTask(id: number, options:{ action: string; payload: string; offset: string }): Promise<ScheduleTask>;
    deleteTask(id: number): Promise<boolean>;
    delete(): Promise<boolean>;
}

export class BaseUser {
    constructor(client: PteroApp | PteroClient, data: any);
    client: PteroApp | PteroClient;
    id?: number;
    username?: string;
    email?: string;
    firstname?: string;
    lastname?: string;
    language?: string;

    toString(): string;
    toJSON(): object;
}

export class PteroUser extends BaseUser {
    constructor(client: PteroApp, data: any);
    client: PteroApp;
    id: number;
    uuid: string;
    externalId: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    langauge: string;
    isAdmin: boolean;
    tfa: boolean;
    twoFactor: boolean;
    relationships: Dict<number, ApplicationServer> | undefined;
    createdAt: Date;
    createdTimestamp: number;
    updatedAt: Date | null;
    updatedTimestamp: number | null;

    get adminURL(): string;
    update(options: Partial<UserCreateOptions>): Promise<PteroUser>;
    delete(): Promise<boolean>;
}

export class PteroSubUser extends BaseUser {
    constructor(client: PteroClient, data: any);
    client: PteroClient;
    uuid: string;
    identifier: string;
    _server: string;
    image: string;
    enabled: boolean;
    permissions: Permissions;
    createdAt: Date;
    createdTimestamp: number;

    get panelURL(): string;
    setPermissions(perms: PermissionResolvable): Promise<this>;
}

export interface APIKey {
    identifier:  string;
    description: string;
    allowedIPs:  string[];
    lastUsedAt:  Date | null;
    createdAt:   Date;
}

export class ClientUser extends BaseUser {
    constructor(client: PteroClient, data: any);
    client: PteroClient;
    uuid: string;
    identifier: string;
    image: string;
    enabled: boolean;
    isAdmin: boolean;
    tokens: string[];
    apikeys: APIKey[];

    get panelURL(): string;
    get2faCode(): Promise<string>;
    enable2fa(): Promise<string>;
    disable2fa(password: string): Promise<void>;
    updateEmail(email: string, password: string): Promise<this>;
    updatePassword(oldpass: string, newpass: string): Promise<void>;
    fetchKeys(): Promise<APIKey[]>;
    createKey(description: string, allowed?: string[]): Promise<APIKey>;
    deleteKey(id: string): Promise<void>;
}
