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

/** Options for creating a node. */
export interface CreateNodeOptions {
    name:                   string;
    location:               string;
    fqdn:                   string;
    scheme:                 string;
    memory:                 number;
    memoryOverallocate?:    number;
    disk:                   number;
    diskOverallocate?:      number;
    sftp:{
        port:               number;
        listener:           number;
    };
    uploadSize?:            number;
}

/** Options for creating a user account. */
export interface CreateUserOptions {
    email:      string;
    username:   string;
    firstname:  string;
    lastname:   string;
    password?:  string;
    isAdmin?:   boolean;
}

/** Options for creating a server. */
export interface CreateServerOptions {
    name:           string;
    egg:            number;
    image:          string;
    startup:        string;
    env:            Record<string, string>;
    allocation:     number;
    limits:         Partial<Limits>;
    featureLimits:  Partial<FeatureLimits>;
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
    };
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
        };
        uploadLimit:    number;
    };
    system:{
        data:           string;
        sftp:{
            bindPort:   number;
        };
    };
    allowedMounts:      string[];
    remote:             string;
}

/** Query options for fetching deployable nodes. */
export interface NodeDeploymentOptions {
    memory:         number;
    disk:           number;
    locationIds?:   number[];
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
    environment?:   Record<string, string>;
    egg?:           number;
    image?:         string;
    skipScripts?:   boolean;
}

export interface UpdateUserOptions extends CreateUserOptions {
    password: string;
}
