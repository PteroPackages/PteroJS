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

export interface WebSocketPayload {
    event: string;
    args?: string[];
}
