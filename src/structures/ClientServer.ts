import type { PteroClient } from '../client';
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

    constructor(client: PteroClient, data: any) {
        this.client = client;
        this.uuid = data.uuid;
        this.identifier = data.identifier;

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

    get panelURL(): string {
        return `${this.client.domain}/server/${this.identifier}`;
    }

    async fetchResources(): Promise<ClientResources> {
        return await this.client.servers.fetchResources(this.identifier);
    }

    async sendCommand(command: string): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.command(this.identifier), { command }
        );
    }

    async setPowerState(state: 'start' | 'stop' | 'restart' | 'kill'): Promise<void> {
        this.client.servers.setPowerState(this.identifier, state);
        this.state = state;
    }

    toJSON(): object {
        return caseConv.toSnakeCase(this, {
            ignore:['client'],
            map:{
                suspended: 'is_suspended',
                installing: 'is_installing'
            }
        });
    }

    toString(): string {
        return this.name;
    }
}
