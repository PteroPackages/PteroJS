import type { ApplicationServer } from './ApplicationServer';
import type { Dict } from './Dict';
import type { PteroApp } from '../application';
import { DaemonData, NodeLocation } from '../common';
import { CreateNodeOptions, NodeConfiguration } from '../common/app';
import caseConv from '../util/caseConv';

export class Node {
    public readonly client: PteroApp;

    /** The internal ID of the node (separate from UUID). */
    public readonly id: number;

    /** The UUID of the node. */
    public readonly uuid: string;

    /** The date the node was created. */
    public readonly createdAt: Date;

    /** Whether the node is public. */
    public public: boolean;

    /** The name of the node. */
    public name: string;

    /** The description of the server (if set). */
    public description: string | undefined;

    /** The ID of the location the node is on. */
    public locationId: number;

    /**
     * The location object the node is on. This is not fetched by default
     * and must be retrieved by including 'location' in `NodeManager#fetch`.
     */
    public location: NodeLocation | undefined;

    /** A dict of servers on the node. */
    public servers: Dict<number, ApplicationServer>;

    /** The FQDN of the node. */
    public fqdn: string;

    /** The HTTP scheme of the node. */
    public scheme: string;

    /** Whether the node is behind a proxy. */
    public behindProxy: boolean;

    /** Whether the node is in maintenance mode. */
    public maintenance: boolean;

    /** The amount of memory the node has. */
    public memory: number;

    /** The amount of memory the node has overallocated. */
    public overallocatedMemory: number;

    /** The amount of disk the node has. */
    public disk: number;

    /** The amount of disk the node has overallocated. */
    public overallocatedDisk: number;

    /** The maximum upload size for the node. */
    public uploadSize: number;

    /** The Wings daemon information. */
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
        if ('description' in data)
            this.description = data.description || undefined;
        if ('location_id' in data) this.locationId = data.location_id;
        if ('fqdn' in data) this.fqdn = data.fqdn;
        if ('scheme' in data) this.scheme = data.scheme;
        if ('behind_proxy' in data) this.behindProxy = data.behind_proxy;
        if ('maintenance_mode' in data)
            this.maintenance = data.maintenance_mode;
        if ('memory' in data) this.memory = data.memory;
        if ('memory_overallocate' in data)
            this.overallocatedMemory = data.memory_overallocate;
        if ('disk' in data) this.disk = data.disk;
        if ('disk_overallocate' in data)
            this.overallocatedDisk = data.disk_overallocate;
        if ('upload_size' in data) this.uploadSize = data.upload_size;
        if (!this.daemon) this.daemon = {} as DaemonData;
        if ('daemon_listen' in data) this.daemon.listening = data.daemon_listen;
        if ('daemon_sftp' in data) this.daemon.sftp = data.daemon_sftp;
        if ('daemon_base' in data) this.daemon.base = data.daemon_base;
    }

    /**
     * Returns a formatted URL to the node in the admin panel.
     * @returns The formatted URL.
     */
    get adminURL(): string {
        return `${this.client.domain}/admin/nodes/view/${this.id}`;
    }

    /**
     * Fetches the configuration of the node.
     * @returns The node configuration.
     */
    async getConfig(): Promise<NodeConfiguration> {
        return await this.client.nodes.getConfig(this.id);
    }

    /**
     * Updates the node with the specified options.
     * @param options Update node options.
     * @see {@link CreateNodeOptions UpdateNodeOptions}.
     * @returns The updated instance.
     */
    async update(options: Partial<CreateNodeOptions>): Promise<this> {
        const data = await this.client.nodes.update(this.id, options);
        this._patch(data.toJSON());
        return this;
    }

    /**
     * Converts the node into a JSON object, relative to the API
     * response object.
     * @returns The JSON object.
     */
    toJSON(): object {
        return caseConv.toSnakeCase(this, {
            ignore: ['client', 'location', 'servers'],
            map: {
                maintainance: 'maintenance_mode',
                overallocatedMemory: 'memory_overallocate',
                overallocatedDisk: 'disk_overallocate',
            },
        });
    }

    /** @returns The string representation of the node. */
    toString(): string {
        return this.name;
    }
}
