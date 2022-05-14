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

export interface ClientMeta {
    isServerOwner?:     boolean;
    userPermissions?:   Record<string, string>;
}

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

export interface FileChmodData {
    file: string;
    mode: number;
}

export interface NetworkAllocation {
    id:         number;
    ip:         string;
    ipAlias:    string;
    port:       number;
    notes:      string | null;
    isDefault:  boolean;
}

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
