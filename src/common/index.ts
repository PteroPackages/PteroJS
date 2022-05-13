export type External<T> = { external?: boolean } & T;
export type Filter<T> = { filter?: string } & T;
export type FilterArray<T> = { filter?: string[] } & T;
export type Include<T> = { include?: string[] } & T;
export type Sort<T> = { sort?: string } & T;
export type Resolvable<T> =
    | string
    | number
    | Record<string, any>
    | T;

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

export interface FetchOptions {
    force?:     boolean;
    page?:      number;
    perPage?:   number;
}

export interface FileConfig {
    application?:   Record<string, OptionSpec>;
    client?:        Record<string, OptionSpec>;
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

export interface PaginationMeta {
    current:    number;
    total:      number;
    count:      number;
    perPage:    number;
    totalPages: number;
    links?:     string[];
}
