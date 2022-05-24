import type { ApplicationServer } from './ApplicationServer';
import type { PteroApp } from '../application';
import type { PteroClient } from '../client';
import { Dict } from './Dict';
import { Permissions } from './Permissions';
import caseConv from '../util/caseConv';
import endpoints from '../client/endpoints';

export abstract class BaseUser {
    public client: PteroApp | PteroClient;

    /** The internal ID of the user. */
    public readonly id: number;

    /** The username of the user. */
    public username: string;

    /** The email of the user. */
    public email: string;

    /** The firstname of the user. */
    public firstname: string;

    /** The lastname of the user. */
    public lastname: string;

    /** The language set for the user. */
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

    /**
     * Converts the user into a JSON object, relative to the API
     * response object.
     * @returns The JSON object.
     */
    toJSON(): object {
        return caseConv.toSnakeCase(
            this,
            {
                ignore:['client'],
                map:{ firstname: 'first_name', lastname: 'last_name' }
            }
        );
    }

    /** @returns The string representation of the user. */
    toString(): string {
        return this.firstname +' '+ this.lastname;
    }
}

export class User extends BaseUser {
    /** The UUID of the user. */
    public readonly uuid: string;

    /** The date the user account was created. */
    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    /** The external ID of the user (if set). */
    public externalId: string | null;

    /** Whether the user is an admin. */
    public isAdmin: boolean;

    /** Whether the user has two-factor authentication enabled. */
    public twoFactor: boolean;

    /** A dict of the servers associated with the user. */
    public servers: Dict<number, ApplicationServer> | undefined;

    /** The date the user account was last updated. */
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

    /**
     * Returns a formatted URL to the user.
     * @returns The formatted URL.
     */
    get adminURL(): string {
        return `${this.client.domain}/admin/users/view/${this.id}`;
    }
}

export class SubUser extends BaseUser {
    /** The UUID of the user. */
    public readonly uuid: string;

    private _server: string;

    /** The date the subuser account was created. */
    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    /** The permissions the subuser has. */
    public permissions: Permissions;

    /** The URL of the user account image. */
    public image: string;

    /** Whether the subuser has two-factor authentication enabled. */
    public enabled: boolean;

    _patch(data: any): void {
        super._patch(data);

        this.permissions = new Permissions(data.permissions ?? {});
        if ('image' in data) this.image = data.image;
        if ('2fa_enabled' in data) this.enabled = data['2fa_enabled'];
    }

    /**
     * Returns a formatted URL to the subuser.
     * @returns The formatted URL.
     */
    get panelURL(): string {
        return `${this.client.domain}/server/${this._server}/users`;
    }
}

export class Account extends BaseUser {
    /** The internal ID of the account. */
    public override id: number;

    /** Whether the account has administrative permissions. */
    public isAdmin: boolean;

    /** The two-factor authentication tokens for the account. */
    public tokens: string[];

    /** The identifiers of API keys associated with the account. */
    public apikeys: any[];

    constructor(public client: PteroClient) {
        super(client, {});

        this.isAdmin = false;
        this.tokens = [];
        this.apikeys = [];
    }

    /**
     * Fetches any missing/partial account information.
     * @returns The updated instance.
     */
    async fetch(): Promise<this> {
        const data = await this.client.requests.get(endpoints.account.main);
        super._patch(data.attributes);

        this.id = data.attributes.id;
        this.isAdmin = data.attributes.admin;
        return this;
    }
}
