import type { ApplicationServer } from './ApplicationServer';
import type { Dict } from './Dict';
import type { PteroApp } from '../application';
import { DaemonData, NodeLocation } from '../common';
import { CreateNodeOptions, NodeConfiguration } from '../common/app';
import caseConv from '../util/caseConv';

export class Node {
    public readonly client: PteroApp;

    public readonly id: number;

    public readonly uuid: string;

    public readonly createdAt: Date;

    public public: boolean;

    public name: string;

    public description: string | undefined;

    public locationId: number;

    public location: NodeLocation | undefined;

    public servers: Dict<number, ApplicationServer>;

    public fqdn: string;

    public scheme: string;

    public behindProxy: boolean;

    public maintenance: boolean;

    public memory: number;

    public overallocatedMemory: number;

    public disk: number;

    public overallocatedDisk: number;

    public uploadSize: number;

    public daemon: DaemonData;

    constructor(client: PteroApp, data: any) {
        this.client = client;
        this.id = data.id;
        this.uuid = data.uuid;
        this.createdAt = new Date(data.created_at);

        this._patch(data);
    }

    public _patch(data: any): void {
        if ('public' in data) this.public = data.public;
        if ('name' in data) this.name = data.name;
        if ('description' in data) this.description = data.description || undefined;
        if ('location_id' in data) this.locationId = data.location_id;
        if ('fqdn' in data) this.fqdn = data.fqdn;
        if ('scheme' in data) this.scheme = data.scheme;
        if ('behind_proxy' in data) this.behindProxy = data.behind_proxy;
        if ('maintenance_mode' in data) this.maintenance = data.maintenance_mode;
        if ('memory' in data) this.memory = data.memory;
        if ('memory_overallocate' in data) this.overallocatedMemory = data.memory_overallocate;
        if ('disk' in data) this.disk = data.disk;
        if ('disk_overallocate' in data) this.overallocatedDisk = data.disk_overallocate;
        if ('upload_size' in data) this.uploadSize = data.upload_size;
        if ('daemon_listen' in data) this.daemon = data.daemon_listen;
    }

    /**
     * Returns a formatted URL to the node in the admin panel.
     * @returns The formatted URL.
     */
    get adminURL(): string {
        return `${this.client.domain}/admin/nodes/view/${this.id}`;
    }

    async getConfig(): Promise<NodeConfiguration> {
        return await this.client.nodes.getConfig(this.id);
    }

    async update(options: Partial<CreateNodeOptions>): Promise<this> {
        const data = await this.client.nodes.update(this.id, options);
        this._patch(data.toJSON());
        return this;
    }

    toJSON(): object {
        return caseConv.toSnakeCase(this, {
            ignore:['client', 'location', 'servers'],
            map:{
                maintainance: 'maintenance_mode',
                overallocatedMemory: 'memory_overallocate',
                overallocatedDisk: 'disk_overallocate'
            }
        });
    }
}