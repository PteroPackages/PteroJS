export interface DaemonData {
    listening:  number;
    sftp:       number;
    base:       string;
}

export interface FeatureLimits {
    allocations:    number;
    backups:        number;
    databases:      number;
}

export interface FileConfig {
    application?: { [key: string]: OptionSpec };
    client?: { [key: string]: OptionSpec };
}

export interface Limits {
    memory:     number;
    swap:       number;
    disk:       number;
    io:         number;
    threads:    string | null;
    cpu:        number;
}

export interface NodeLocation {
    id:         number;
    long:       string;
    short:      string;
    createdAt:  Date;
    updatedAt:  Date | null;
}

export interface OptionSpec {
    fetch?:  boolean;
    cache?:  boolean;
    max?:    number;
}
