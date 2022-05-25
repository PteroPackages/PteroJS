import type { PteroClient } from '../client';
import { BackupManager } from '../client/BackupManager';
import { DatabaseManager } from '../client/DatabaseManager';
import { FileManager } from '../client/FileManager';
import { NetworkManager } from '../client/NetworkManager';
import { SubUserManager } from '../client/SubUserManager';
import { FeatureLimits, Limits } from '../common';
import { ClientResources } from '../common/client';
import endpoints from '../client/endpoints';
import caseConv from '../util/caseConv';

export class ClientServer {
    public client: PteroClient;

    /** The UUID of the server. */
    public readonly uuid: string;

    /** A substring of the server's UUID. */
    public readonly identifier: string;

    /** The name of the server. */
    public name: string;

    /** The description of the server (if set). */
    public description: string | undefined;

    /** Whether the client user is the server owner. */
    public isOwner: boolean;

    /** The name of the node the server is on. */
    public node: string;

    /** An object containing the SFTP details. */
    public sftpDetails:{
        ip: string;
        port: number;
    }

    /** An object containing the server limits. */
    public limits: Limits;

    /** An object containing the server feature limits. */
    public featureLimits: FeatureLimits;

    /** The current state of the server. */
    public state: string | undefined;

    /** Whether the server is suspended. */
    public suspended: boolean;

    /** Whether the server is transferring. */
    public installing: boolean;

    public backups: BackupManager;
    public databases: DatabaseManager;
    public files: FileManager;
    public network: NetworkManager;
    public users: SubUserManager;

    constructor(client: PteroClient, data: any) {
        this.client = client;
        this.uuid = data.uuid;
        this.identifier = data.identifier;

        this.backups = new BackupManager(client, data.identifier);
        this.databases = new DatabaseManager(client, data.identifier);
        this.files = new FileManager(client, data.identifier);
        this.network = new NetworkManager(client, data.identifier);
        this.users = new SubUserManager(client, data.identifier);

        this._patch(data);
    }

    _patch(data: any): void {
        if ('name' in data) this.name = data.name;
        if ('description' in data) this.description = data.description || undefined;
        if ('is_owner' in data) this.isOwner = data.is_owner;
        if ('node' in data) this.node = data.node;
        if ('sftp_details' in data) this.sftpDetails = data.sftp_details;
        if ('limits' in data) this.limits = caseConv.toCamelCase(data.limits);
        if ('feature_limits' in data) this.featureLimits = data.feature_limits;
        if ('state' in data) this.state = data.state;
        if ('is_suspended' in data) this.suspended = data.is_suspended;
        if ('is_installing' in data) this.installing = data.is_installing;
    }

    /**
     * Returns a formatted URL to the server.
     * @returns The formatted URL.
     */
    get panelURL(): string {
        return `${this.client.domain}/server/${this.identifier}`;
    }

    /**
     * Fetches the server resources data.
     * @returns The server resources.
     */
    async fetchResources(): Promise<ClientResources> {
        return await this.client.servers.fetchResources(this.identifier);
    }

    /**
     * Sends a command to the server console.
     * @param command The command to send.
     */
    async sendCommand(command: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.command(this.identifier), { command }
        );
    }

    /**
     * Sets the power state of the server.
     * @param state The power state.
     */
    async setPowerState(state: 'start' | 'stop' | 'restart' | 'kill'): Promise<void> {
        this.client.servers.setPowerState(this.identifier, state);
        this.state = state;
    }

    /**
     * Updates the server's docker image.
     * @param image The docker image.
     */
    async setDockerImage(image: string): Promise<void> {
        await this.client.servers.setDockerImage(this.identifier, image);
    }

    /**
     * Updates the server's name.
     * @param name The new server name.
     */
    async rename(name: string): Promise<void> {
        await this.client.servers.rename(this.identifier, name);
        this.name = name;
    }

    /** Triggers the reinstall process for the server. */
    async reinstall(): Promise<void> {
        await this.client.servers.reinstall(this.identifier);
        this.installing = true;
    }

    /**
     * Converts the server into a JSON object, relative to the API
     * response object.
     * @returns The JSON object.
     */
    toJSON(): object {
        return caseConv.toSnakeCase(this, {
            ignore:['client'],
            map:{
                suspended: 'is_suspended',
                installing: 'is_installing'
            }
        });
    }

    /** @returns The string representation of the server. */
    toString(): string {
        return this.name;
    }
}
