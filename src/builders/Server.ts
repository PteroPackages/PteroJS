import type { User } from '../structures/User';
import { Builder } from './base';
import { CreateServerOptions, Egg } from '../common/app';
import { ValidationError } from '../structures/Errors';
import { FeatureLimits, Limits } from '../common';

export class ServerBuilder extends Builder {
    private externalId: string | undefined;
    private name: string;
    private description: string | undefined;
    private user: number;
    private egg: number;
    private dockerImage: string;
    private startup: string;
    private environment: Record<string, string | number | boolean>;
    private skipScripts?: boolean;
    private oomDisabled?: boolean;
    private limits: Limits;
    private featureLimits: FeatureLimits;
    private allocation?:{
        default: number;
        additional?: number[];
    }
    private deploy?:{
        locations: number[];
        dedicatedIp: boolean;
        portRange: string[];
    }
    private startOnCompletion?: boolean;

    constructor() {
        super();

        this.environment = {};
        this.limits = {
            memory: 128,
            swap: 0,
            disk: 512,
            io: 500,
            cpu: 100,
            threads: null
        };
        this.featureLimits = {
            allocations: 1,
            databases: 1,
            backups: 1
        };
        this.allocation = { default: 0 };
        this.deploy = {
            locations: [],
            dedicatedIp: false,
            portRange: []
        };
    }

    setExternalId(id: string | undefined): this {
        this.externalId = id;
        return this;
    }

    setName(name: string): this {
        this.name = name;
        return this;
    }

    setDescription(description: string): this {
        this.description = description;
        return this;
    }

    setUser(user: number | User): this {
        this.user = typeof user === 'number' ? user : user.id;
        return this;
    }

    setEgg(egg: number | Egg): this {
        if (typeof egg === 'number') {
            this.egg = egg;
        } else {
            this.egg = egg.id;
            this.dockerImage = Object.values(egg.dockerImages)[0];
            this.startup = egg.startup;
        }

        return this;
    }

    setDockerImage(image: string): this {
        this.dockerImage = image;
        return this;
    }

    setStartup(command: string): this {
        this.startup = command;
        return this;
    }

    setVariable(key: string, value: string | number | boolean): this {
        this.environment[key] = value;
        return this;
    }

    setEnvironment(variables: Record<string, string | number | boolean>): this {
        this.environment = variables;
        return this;
    }

    setSkipScripts(value: boolean): this {
        this.skipScripts = value;
        return this;
    }

    setOOMDisabled(value: boolean): this {
        this.oomDisabled = value;
        return this;
    }

    setLimits(limits: Partial<Limits>): this {
        this.limits = Object.assign(this.limits, limits);
        return this;
    }

    setFeatureLimits(featureLimits: Partial<FeatureLimits>): this {
        this.featureLimits = Object.assign(this.featureLimits, featureLimits);
        return this;
    }

    setAllocation(options:{ default?: number; additional?: number[] }): this {
        if (options.default) this.allocation!.default = options.default;
        if (options.additional?.length)
            this.allocation!.additional =
                (this.allocation!.additional || []).concat(options.additional);

        return this;
    }

    setDeployment(options:{
        locations?: number[];
        dedicatedIp?: boolean;
        portRange?: string[]
    }): this {
        if (options.locations?.length)
            this.deploy!.locations =
                (this.deploy!.locations || []).concat(options.locations);

        if (options.dedicatedIp != undefined)
            this.deploy!.dedicatedIp = options.dedicatedIp;

        if (options.portRange?.length)
            this.deploy!.portRange =
                (this.deploy!.portRange || []).concat(options.portRange);

        return this;
    }

    setStartOnCompletion(value: boolean): this {
        this.startOnCompletion = value;
        return this;
    }

    build(): CreateServerOptions {
        if (!this.name) throw new ValidationError('A server name is required');
        if (!this.user) throw new ValidationError('A server owner (user) is required');
        if (!this.egg) throw new ValidationError('An egg is required');
        if (!this.dockerImage) throw new ValidationError('A docker image is required');
        if (!this.startup) throw new ValidationError('A startup command is required');

        if (
            !this.deploy!.locations.length ||
            !this.deploy!.portRange.length
        ) {
            if (!this.allocation!.default) throw new ValidationError(
                'A default allocation or deployment options is required'
            );
        }

        return super.build();
    }
}
