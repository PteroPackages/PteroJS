import type { Node } from './Node';
import type { User } from './User';
import type { PteroApp } from '../application';
import { ApplicationDatabaseManager } from '../application/ApplicationDatabaseManager';
import { Limits, FeatureLimits } from '../common';
import {
    UpdateBuildOptions,
    UpdateDetailsOptions,
    UpdateStartupOptions,
} from '../common/app';
import caseConv from '../util/caseConv';

export type ApplicationServerStatus =
    | 'installing'
    | 'install_failed'
    | 'reinstall_failed'
    | 'suspended'
    | 'restoring_backup';

export class ApplicationServer {
    public client: PteroApp;
    public databases: ApplicationDatabaseManager;

    /** The internal ID of the server (separate from UUID). */
    public readonly id: number;

    /** The UUID of the server. */
    public readonly uuid: string;

    /** A substring of the server's UUID. */
    public readonly identifier: string;

    /** The date the server was created. */
    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    /** The external ID of the server (if set). */
    public externalId: string | undefined;

    /** The name of the server. */
    public name: string;

    /** The description of the server (if set). */
    public description: string | undefined;

    /** The current processing status of the server. */
    public status: ApplicationServerStatus | null;

    /** Whether the server is suspended from action. */
    public suspended: boolean;

    /** An object containing the server's limits. */
    public limits: Limits;

    /** An object containing the server's feature limits. */
    public featureLimits: FeatureLimits;

    /** The ID of the server owner. */
    public ownerId: number;

    /**
     * The owner of the server. This is not fetched by default and must be
     * retrieved by including 'user' in ApplicationServerManager#fetch.
     */
    public owner: User | undefined;

    /** The ID of the node the server is on. */
    public nodeId: number;

    /**
     * The node the server is on. This is not fetched by default and must be
     * retrieved by including 'node' in `ApplicationServerManager#fetch`.
     */
    public node: Node | undefined;

    /** The ID of the allocation for the server. */
    public allocation: number;

    /** The ID of the nest the server is part of. */
    public nest: number;

    /** The ID of the egg the server uses. */
    public egg: number;

    public container: {
        startupCommand: string;
        image: string;
        installed: boolean;
        environment: Record<string, string>;
    };

    constructor(client: PteroApp, data: any) {
        this.client = client;
        this.databases = new ApplicationDatabaseManager(client, data.id);
        this.id = data.id;
        this.uuid = data.uuid;
        this.identifier = data.identifier;
        this.createdAt = new Date(data.created_at);
        this.createdTimestamp = this.createdAt.getTime();

        this._patch(data);
    }

    _patch(data: any): void {
        if ('external_id' in data) this.externalId = data.external_id;
        if ('name' in data) this.name = data.name;
        if ('description' in data)
            this.description = data.description || undefined;
        if ('status' in data) this.status = data.status;
        if ('suspended' in data) this.suspended = data.suspended;
        if ('limits' in data) this.limits = caseConv.toCamelCase(data.limits);
        if ('feature_limits' in data) this.featureLimits = data.feature_limits;
        if ('user' in data) this.ownerId = data.user;
        if ('node' in data) this.nodeId = data.node;
        if ('allocation' in data) this.allocation = data.allocation;
        if ('nest' in data) this.nest = data.nest;
        if ('egg' in data) this.egg = data.egg;
        if ('container' in data) {
            this.container = caseConv.toCamelCase(data.container, {
                ignore: ['environment'],
            });
            this.container.environment = data.container.environment;
            this.container.installed = !!this.container.installed;
        }

        if ('relationships' in data) {
            this.owner =
                'user' in data.relationships
                    ? this.client.users.resolve(data)
                    : undefined;

            this.node =
                'node' in data.relationships
                    ? this.client.nodes.resolve(data)
                    : undefined;
        }
    }

    /**
     * Returns a formatted URL to the server.
     * @returns The formatted URL.
     */
    get panelURL(): string {
        return `${this.client.domain}/server/${this.identifier}`;
    }

    /**
     * Returns a formatted URL to the server in the admin panel.
     * @returns The formatted URL.
     */
    get adminURL(): string {
        return `${this.client.domain}/admin/servers/view/${this.id}`;
    }

    /**
     * Fetches the User object of the server owner.
     * The user can be accessed via {@link ApplicationServer.owner}.
     * @returns The fetched user.
     */
    async fetchOwner(): Promise<User> {
        if (this.owner) return this.owner;
        const user = await this.client.users.fetch(this.ownerId, {
            force: true,
        });
        this.owner = user;
        return user;
    }

    /**
     * Updates the details of the server.
     * @param options Update details options.
     * @see {@link UpdateDetailsOptions}.
     * @returns The updated instance.
     */
    async updateDetails(options: UpdateDetailsOptions): Promise<this> {
        const data = await this.client.servers.updateDetails(this.id, options);
        this._patch(data.toJSON());
        return this;
    }

    /**
     * Updates the build configuration of the server.
     * @param options Update build options.
     * @returns The updated instance.
     */
    async updateBuild(options: UpdateBuildOptions): Promise<this> {
        const data = await this.client.servers.updateBuild(this.id, options);
        this._patch(data);
        return this;
    }

    /**
     * Updates the startup configuration of the server.
     * @param options Update startup options.
     * @see {@link UpdateStartupOptions}.
     * @returns The updated instance.
     */
    async updateStartup(options: UpdateStartupOptions): Promise<this> {
        const data = await this.client.servers.updateStartup(this.id, options);
        this._patch(data);
        return this;
    }

    /** Suspends the server. */
    async suspend(): Promise<void> {
        await this.client.servers.suspend(this.id);
    }

    /** Unsuspends the server. */
    async unsuspend(): Promise<void> {
        await this.client.servers.unsuspend(this.id);
    }

    /**
     * Triggers the reinstall process for the server.
     * Note: most endpoints will be unavailable until this is complete.
     */
    async reinstall(): Promise<void> {
        await this.client.servers.reinstall(this.id);
    }

    /**
     * Converts the server into a JSON object, relative to the API
     * response object.
     * @returns The JSON object.
     */
    toJSON(): object {
        return caseConv.toSnakeCase(this, {
            ignore: ['client', 'user', 'node'],
            map: { ownerId: 'user', nodeId: 'node' },
        });
    }

    /** @returns The string representation of the server. */
    toString(): string {
        return this.name;
    }
}
