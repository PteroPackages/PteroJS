import type { ApplicationServer } from './ApplicationServer';
import type { PteroApp } from '../application';
import type { PteroClient } from '../client';
import { Dict } from './Dict';
import { Permissions } from './Permissions';
import caseConv from '../util/caseConv';
import endpoints from '../client/endpoints';

export abstract class BaseUser {
    public client: PteroApp | PteroClient;

    public readonly id: number;

    public username: string;

    public email: string;

    public firstname: string;

    public lastname: string;

    public language: string;

    constructor(client: PteroApp | PteroClient, data: any) {
        this.client = client;
        this.id = data.id;

        this._patch(data);
    }

    _patch(data: any): void {
        if ('username' in data) this.username = data.username;
        if ('email' in data) this.email = data.email;
        if ('first_name' in data) this.firstname = data.first_name;
        if ('last_name' in data) this.lastname = data.last_name;
        if ('language' in data) this.language = data.language;
    }

    toString(): string {
        return this.firstname +' '+ this.lastname;
    }

    toJSON(): object {
        return caseConv.toSnakeCase(
            this,
            {
                ignore:['client'],
                map:{ firstname: 'first_name', lastname: 'last_name' }
            }
        );
    }
}

export class User extends BaseUser {
    public readonly uuid: string;

    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    public externalId: string | null;
    
    public isAdmin: boolean;

    public twoFactor: boolean;

    public servers: Dict<number, ApplicationServer> | undefined;

    public updatedAt: Date | undefined;
    public updatedTimestamp: number | undefined;

    constructor(client: PteroApp, data: any) {
        super(client, data);

        this.createdAt = new Date(data.created_at);
        this.createdTimestamp = this.createdAt.getTime();
        this.servers = undefined; // Not implemented yet
    }

    _patch(data: any): void {
        super._patch(data);

        this.externalId = data.external_id || undefined;
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : undefined;
        this.updatedTimestamp = this.updatedAt?.getTime() || undefined;

        if ('root_admin' in data) this.isAdmin = data.root_admin;
        if ('2fa' in data) this.twoFactor = data['2fa'];
    }

    get adminURL(): string {
        return `${this.client.domain}/admin/users/view/${this.id}`;
    }
}

export class SubUser extends BaseUser {
    public readonly uuid: string;
    private _server: string;

    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    public permissions: Permissions;

    public image: string;

    public enabled: boolean;

    _patch(data: any): void {
        super._patch(data);

        this.permissions = new Permissions(data.permissions ?? {});
        if ('image' in data) this.image = data.image;
        if ('2fa_enabled' in data) this.enabled = data['2fa_enabled'];
    }

    get panelURL() {
        return `${this.client.domain}/server/${this._server}/users`;
    }
}

export class Account extends BaseUser {
    public override id: number;
    public isAdmin: boolean;
    public tokens: string[];
    public apikeys: any[];

    constructor(public client: PteroClient) {
        super(client, {});

        this.isAdmin = false;
        this.tokens = [];
        this.apikeys = [];
    }

    async fetch(): Promise<this> {
        const data = await this.client.requests.get(endpoints.account.main);
        super._patch(data.attributes);

        this.id = data.attributes.id;
        this.isAdmin = data.attributes.admin;
        return this;
    }
}
