/** Applies an external option to the request. */
export type External<T> = { external?: boolean } & T;

/** Applies a filter option to the request. */
export type Filter<T> = { filter?: string } & T;

/** An internal form of the filter arguments. */
export type FilterArray<T> = { filter?: string[] } & T;

/** Applies an include option on the request. */
export type Include<T> = { include?: string[] } & T;

/** Applies a sort option on the request. */
export type Sort<T> = { sort?: string } & T;

/** The types object `T` can be resolved from, including itself. */
export type Resolvable<T> = string | number | Record<string, any> | T;

/** Represents the daemon information on a node. */
export interface DaemonData {
    listening: number;
    sftp: number;
    base: string;
}

/** Represents the feature limits of a server. */
export interface FeatureLimits {
    /** The total number of allocations for the server. */
    allocations: number;
    /** The total number of backups allowed on the server. */
    backups: number;
    /** The total number of databases on the server. */
    databases: number;
}

/** General fetch options for requests. */
export interface FetchOptions {
    /**
     * Whether to skip cache checks and go straight to the request.
     * This does not apply to all managers that use FetchOptions,
     * check the specific method docs for more information.
     * @default false
     */
    force?: boolean;
    /**
     * The page number to get results from.
     * @default 1
     */
    page?: number;
    /**
     * The number of results to return per-page.
     * @default 50
     */
    perPage?: number;
}

/** Represents the configuration for the pterojs.json file. */
export interface FileConfig {
    application?: Record<string, OptionSpec>;
    client?: Record<string, OptionSpec>;
}

/** Represents the limits of a server. */
export interface Limits {
    /** The amount of memory allocated to the server. */
    memory: number;
    /** The amount of swap space allocated to the server. */
    swap: number;
    /** The amount of disk allocated to the server. */
    disk: number;
    /** The amount of block IO bandwidth allowed for the server. */
    io: number;
    /**
     * The number of threads (or specific threads) the server can use.
     * `null` means unlimited.
     */
    threads: string | null;
    /** The amount of CPU allocated to the server. */
    cpu: number;
}

/** Represents a location object. */
export interface NodeLocation {
    id: number;
    long: string;
    short: string;
    createdAt: Date;
    updatedAt: Date | null;
}

/**
 * Option specification attributes for the {@link FileConfig}.
 * PteroJS currently supports the following config options:
 * * users
 * * nodes
 * * nests
 * * servers
 * * locations
 * * subUsers
 */
export interface OptionSpec {
    /**
     * Whether to call the option manager's `fetch()` method
     * (used by the main class' `connect()` method).
     */
    fetch?: boolean;
    /** Whether to cache the option manager's values. */
    cache?: boolean;
    /**
     * The maximum amount of entries to allow for the option manager's cache.
     * @experimental
     */
    max?: number;
}

/**
 * Represents the metadata received from endpoints with
 * paginated responses.
 */
export interface PaginationMeta {
    current: number;
    total: number;
    count: number;
    perPage: number;
    totalPages: number;
    links?: string[];
}

export interface RequestEvents {
    debug: [message: string];
    preRequest: [data: any];
    postRequest: [data: any];
}
