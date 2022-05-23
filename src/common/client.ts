/** Represents a server backup object. */
export interface Backup {
    uuid:           string;
    name:           string;
    ignoredFiles:   string[];
    hash:           string | undefined;
    bytes:          number;
    checksum:       string | undefined;
    successful:     boolean;
    locked:         boolean;
    createdAt:      Date;
    completedAt:    Date | undefined;
}

/** Represents the client metedata from a client servers request. */
export interface ClientMeta {
    isServerOwner?:     boolean;
    userPermissions?:   Record<string, string>;
}

/** Represents the currently used resources of a server. */
export interface ClientResources {
    currentState:       string;
    isSuspended:        boolean;
    resources:{
        memoryBytes:    number;
        cpuAbsolute:    number;
        diskBytes:      number;
        networkRxBytes: number;
        networkTxBytes: number;
        uptime:         number;
    }
}

/** Options for creating a server backup. */
export interface CreateBackupOptions {
    name?:      string;
    isLocked?:  boolean;
    ignored?:   string;
}

export interface CreateScheduleOptions extends Omit<Cron, 'month'> {
    name:           string;
    active:         boolean;
}

/** Represents a schedule cronjob object. */
export interface Cron {
    dayOfWeek:  string;
    dayOfMonth: string;
    month:      string;
    hour:       string;
    minute:     string;
}

/** Represents a server database object. */
export interface Database {
    id:                 number;
    name:               string;
    username:           string;
    host:{
        address:        string;
        port:           number;
    }
    connectionsFrom:    string;
    maxConnections:     string;
    password?:          string;
}

/** Represents a file or file-like object on the server. */
export interface File {
    name:       string;
    mode:       string;
    modeBits:   bigint;
    size:       number;
    isFile:     boolean;
    isSymlink:  boolean;
    mimetype:   string;
    createdAt:  Date;
    modifiedAt: Date | undefined;
}

/** Options for changing file permissions. */
export interface FileChmodData {
    file: string;
    mode: number;
}

/** Represents a network allocation object for a server. */
export interface NetworkAllocation {
    id:         number;
    ip:         string;
    ipAlias:    string;
    port:       number;
    notes:      string | null;
    isDefault:  boolean;
}

/** Represents a task for a schedule. */
export interface ScheduleTask {
    id:         number;
    sequenceId: number;
    action:     string;
    payload:    string;
    offset:     number;
    queued:     boolean;
    createdAt:  Date;
    updatedAt:  Date | undefined;
}

export type ScheduleTaskAction = 'backup' | 'command' | 'power';

export enum ShardStatus {
    CLOSED,
    CONNECTING,
    CONNECTED
}

export interface WebSocketAuth {
    data:{
        socket: string;
        token:  string;
    }
}

export interface WebSocketEvents {
    debug:              [message: string];
    error:              [message: string];
    rawPayload:         [data: any];

    authSuccess:        [];
    serverConnect:      [id: string];
    serverOutput:       [output: string];
    daemonMessage:      [output: string];
    serverDisconnect:   [];

    statsUpdate:        [stats: ClientResources];
    statusUpdate:       [status: string];
    transferUpdate:     [data: any];

    installStart:       [];
    installOutput:      [output: string];
    installComplete:    [];

    backupComplete:     [backup: Partial<Backup>];
}

export interface WebSocketPayload {
    event: string;
    args?: string[];
}
