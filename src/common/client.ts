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
