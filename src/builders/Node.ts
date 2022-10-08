import { Builder } from './base';
import { CreateNodeOptions } from '../common/app';
import { ValidationError } from '../structures/Errors';

export class NodeBuilder extends Builder {
    private name: string;
    private description: string | undefined;
    private locationId: number;
    private public: boolean; // ironic
    private fqdn: string;
    private scheme: string;
    private behindProxy: boolean;
    private memory: number;
    private memoryOverallocate: number;
    private disk: number;
    private diskOverallocate: number;
    private daemonBase: string;
    private daemonSftp: number;
    private daemonListen: number;
    private maintenanceMode: boolean;
    private uploadSize: number;

    constructor() {
        super();

        this.name = '';
        this.description = undefined;
        this.locationId = 0;
        this.public = false;
        this.fqdn = '';
        this.scheme = '';
        this.behindProxy = false;
        this.memory = 0;
        this.memoryOverallocate = -1;
        this.disk = 0;
        this.diskOverallocate = -1;
        this.daemonBase = '/var/lib/pterodactyl/volumes';
        this.daemonSftp = 2022;
        this.daemonListen = 8080;
        this.maintenanceMode = false;
        this.uploadSize = 0;
    }

    setName(name: string): this {
        this.name = name;
        return this;
    }

    setDescription(description: string): this {
        this.description = description;
        return this;
    }

    setLocationId(id: number): this {
        this.locationId = id;
        return this;
    }

    setPublic(value: boolean): this {
        this.public = value;
        return this;
    }

    setFQDN(fqdn: string): this {
        this.fqdn = fqdn;
        return this;
    }

    setScheme(scheme: string): this {
        this.scheme = scheme;
        return this;
    }

    setBehindProxy(value: boolean): this {
        this.behindProxy = value;
        return this;
    }

    setMemory(memory: number, overallocate?: number): this {
        this.memory = memory;
        if (overallocate) this.memoryOverallocate = overallocate;
        return this;
    }

    setDisk(disk: number, overallocate?: number): this {
        this.disk = disk;
        if (overallocate) this.diskOverallocate = overallocate;
        return this;
    }

    setDaemonBase(base: string): this {
        this.daemonBase = base;
        return this;
    }

    setDaemonSFTP(port: number): this {
        this.daemonSftp = port;
        return this;
    }

    setDaemonListen(port: number): this {
        this.daemonListen = port;
        return this;
    }

    setMaintenance(mode: boolean): this {
        this.maintenanceMode = mode;
        return this;
    }

    setUploadSize(size: number): this {
        this.uploadSize = size;
        return this;
    }

    build(): CreateNodeOptions {
        if (!this.name) throw new ValidationError('A node name is required');
        if (!this.locationId) throw new ValidationError('A location id is required');
        if (!this.fqdn) throw new ValidationError('An FQDN is required');
        if (!this.scheme) throw new ValidationError('A HTTP scheme is required');
        if (!this.memory) throw new ValidationError('A total memory limit is required');
        if (this.memory < 1) throw new ValidationError('Memory cannot be less than 1');
        if (this.memoryOverallocate < -1) throw new ValidationError('Overallocated memory cannot be less than -1');
        if (!this.disk) throw new ValidationError('A total disk limit is required');
        if (this.disk < 1) throw new ValidationError('Disk cannot be less than 1');
        if (this.diskOverallocate < -1) throw new ValidationError('Overallocated disk cannot be less than -1');
        if (this.uploadSize < 1 || this.uploadSize > 1024) throw new ValidationError(
            'The upload size must be between 1 and 1024'
        );

        return super.build();
    }
}
