import { FeatureLimits, Limits } from '../common';

export interface CreateUserOptions {
    email:      string;
    username:   string;
    firstname:  string;
    lastname:   string;
    password?:  string;
    isAdmin?:   boolean;
}

export interface CreateServerOptions {
    name:           string;
    egg:            number;
    image:          string;
    startup:        string;
    env:            { [key: string]: string };
    allocation:     number;
    limits:         Partial<Limits>;
    featureLimits:  Partial<FeatureLimits>;
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
    environment?:   { [key: string]: string };
    egg?:           number;
    image?:         string;
    skipScripts?:   boolean;
}

export interface UpdateUserOptions extends CreateUserOptions {
    password: string;
}
