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

export interface OptionSpec {
    fetch?:  boolean;
    cache?:  boolean;
    max?:    number;
}
