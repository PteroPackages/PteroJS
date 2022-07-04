import { FeatureLimits, Limits } from '../common';

/** Represents an allocation object. */
export interface Allocation {
    id:         number;
    ip:         string;
    alias:      string | undefined;
    port:       number;
    notes:      string | undefined;
    assigned:   boolean;
}

export interface ApplicationDatabase {
    id:             number;
    serverId:       number;
    hostId:         number;
    database:       unknown;
    username:       string;
    remote:         string;
    maxConnections: number;
    createdAt:      Date;
    updatedAt:      Date | undefined;
}

/** Options for creating a node. */
export interface CreateNodeOptions {
    name:                   string;
    description:            string | undefined;
    /** @deprecated Broken, use `locationId`. */
    location:               string;
    locationId:             number;
    public:                 boolean;
    fqdn:                   string;
    scheme:                 string;
    behindProxy:            boolean;
    memory:                 number;
    memoryOverallocate?:    number;
    disk:                   number;
    diskOverallocate?:      number;
    /** @deprecated Use `daemonPort` and `daemonListen` instead. */
    sftp:{
        port:               number;
        listener:           number;
    }
    daemonBase:             string;
    daemonSftp:             number;
    daemonListen:           number;
    maintenanceMode:        boolean;
    uploadSize?:            number;
}

/** Options for creating a user account. */
export interface CreateUserOptions {
    externalId?:    string;
    email:          string;
    username:       string;
    firstname:      string;
    lastname:       string;
    password?:      string;
    isAdmin?:       boolean;
}

/** Options for creating a server. */
export interface CreateServerOptions {
    /** The external identifier of the server. */
    externalId?:        string;
    /** The name of the server. */
    name:               string;
    /**
     * A description of the server.
     * @default undefined
     */
    description?:       string;
    /** The ID of the user that will own the server. */
    user:               number;
    /** The egg to use for the server. */
    egg:                number;
    /** The default docker image for the server. */
    dockerImage:        string;
    /** The server startup command. */
    startup:            string;
    /** An environment variables object. */
    environment:        Record<string, string | number | boolean>;
    /**
     * Whether to skip the egg installation script.
     * @default false
     */
    skipScripts?:       boolean;
    /** Doesn't work, don't use this. */
    oomDisabled?:       boolean;
    /** The server limits. */
    limits?:            Partial<Limits>;
    /** The server's feature limits. */
    featureLimits?:     Partial<FeatureLimits>;
    /** The server allocation details. */
    allocation:{
        /** The default server allocation. */
        default:        number;
        /** Additional allocations for the server. */
        additional?:    number[];
    }
    /**
     * Node deployment options. This is for more control over where the
     * server is deployed within the location and port ranges specified.
     */
    deploy?:{
        locations:      number[];
        dedicatedIp:    boolean;
        portRange:      string[];
    }
    /**
     * Whether to start the server after the installation process is complete.
     * @default false
     */
    startOnCompletion?: boolean;
}

/** Represents a nest egg object. */
export interface Egg {
    id:                 number;
    uuid:               string;
    nest:               number;
    name:               string;
    description:        string;
    author:             string;
    /**
     * @deprecated Will be removed in Pterodactyl v2 in favour of
     * {@link dockerImages}.
     */
    dockerImage:        string;
    dockerImages:       string[];
    config:{
        files:          Record<string, any>;
        startup:        Record<string, any>;
        stop:           string;
        logs:           string[];
        fileDenylist:   string[];
        extends:        string | null;
    }
    startup:            string;
    script:{
        privileged:     boolean;
        install:        string;
        entry:          string;
        container:      string;
        extends:        string | null;
    }
    createdAt:          Date;
    updatedAt:          Date | undefined;
}

/** Represents a nest object. */
export interface Nest {
    id:             number;
    uuid:           string;
    author:         string;
    name:           string;
    description:    string;
    createdAt:      Date;
    updatedAt:      Date | undefined;
}

/** Represents a node configuration object (from Wings). */
export interface NodeConfiguration {
    uuid:               string;
    tokenId:            string;
    token:              string;
    debug:              boolean;
    api:{
        host:           string;
        port:           number;
        ssl:{
            enabled:    boolean;
            cert:       string;
            key:        string;
        }
        uploadLimit:    number;
    };
    system:{
        data:           string;
        sftp:{
            bindPort:   number;
        }
    }
    allowedMounts:      string[];
    remote:             string;
}

/** Query options for fetching deployable nodes. */
export interface NodeDeploymentOptions {
    memory:         number;
    disk:           number;
    locationIds?:   number[];
}

/** Represents a server status. If the server has no status, `NONE` is used. */
export enum ServerStatus {
    INSTALLING = 'installing',
    INSTALL_FAILED = 'install_failed',
    SUSPENDED = 'suspended',
    RESTORING = 'restoring_backup',
    NONE = ''
}

export interface UpdateBuildOptions extends Partial<Limits & FeatureLimits> {
    allocation?:        number;
    oomDisabled?:       boolean;
    addAllocations?:    number[];
    removeAllocations?: number[];
}

export interface UpdateDetailsOptions {
    name?:          string;
    owner?:         number;
    externalId?:    string;
    description?:   string;
}

export interface UpdateStartupOptions {
    startup?:       string;
    environment?:   Record<string, string | number | boolean>;
    egg?:           number;
    image?:         string;
    skipScripts?:   boolean;
}

export interface UpdateUserOptions extends CreateUserOptions {}
