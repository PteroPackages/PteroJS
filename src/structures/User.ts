import type { ApplicationServer } from './ApplicationServer';
import type { PteroApp } from '../application';
import type { PteroClient } from '../client';
import { Dict } from './Dict';
import { Permissions } from './Permissions';
import { ValidationError } from './Errors';
import { Activity, APIKey, SSHKey } from '../common/client';
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
        return caseConv.toSnakeCase(this, {
            ignore: ['client'],
            map: { firstname: 'first_name', lastname: 'last_name' },
        });
    }

    /** @returns The string representation of the user. */
    toString(): string {
        return this.firstname + ' ' + this.lastname;
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

    constructor(public client: PteroApp, data: any) {
        super(client, data);

        this.createdAt = new Date(data.created_at);
        this.createdTimestamp = this.createdAt.getTime();

        if ('relationships' in data) {
            this.servers =
                'servers' in data.relationships
                    ? (this.client.servers.resolve(data) as Dict<
                          number,
                          ApplicationServer
                      >)
                    : undefined;
        }
    }

    _patch(data: any): void {
        super._patch(data);

        this.externalId = data.external_id || undefined;
        this.updatedAt = data.updated_at
            ? new Date(data.updated_at)
            : undefined;
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

export class SubUser {
    /** The UUID of the user. */
    public readonly uuid: string;

    /** The identifier of the server the subuser belongs to. */
    public readonly serverId: string;

    /** The date the subuser account was created. */
    public readonly createdAt: Date;
    public readonly createdTimestamp: number;

    /** The username of the subuser. */
    public username: string;

    /** The email of the subuser. */
    public email: string;

    /** The URL of the subuser account image. */
    public image: string;

    /** Whether the subuser has two-factor authentication enabled. */
    public enabled: boolean;

    /** The permissions the subuser has. */
    public permissions: Permissions;

    constructor(public client: PteroClient, serverId: string, data: any) {
        this.uuid = data.uuid;
        this.serverId = serverId;
        this.createdAt = new Date(data.created_at);
        this.createdTimestamp = this.createdAt.getTime();

        this._patch(data);
    }

    _patch(data: any): void {
        if ('username' in data) this.username = data.username;
        if ('email' in data) this.email = data.email;
        if ('image' in data) this.image = data.image;
        if ('2fa_enabled' in data) this.enabled = data['2fa_enabled'];
        if ('permissions' in data)
            this.permissions = new Permissions(...(data.permissions ?? []));
    }

    /**
     * Returns a formatted URL to the subuser.
     * @returns The formatted URL.
     */
    get panelURL(): string {
        return `${this.client.domain}/server/${this.serverId}/users`;
    }

    /**
     * Updates the permissions of the subuser.
     * @param permissions The permissions to set.
     * @returns The updated subuser instance.
     */
    async setPermissions(...permissions: string[]): Promise<this> {
        const perms = Permissions.resolve(...permissions);
        if (!perms.length)
            throw new ValidationError(
                'No permissions specified for the subuser.',
            );

        const data = await this.client.requests.post(
            endpoints.servers.users.get(this.serverId, this.uuid),
            { permissions: perms },
        );
        this._patch(data);
        return this;
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
    public apikeys: APIKey[];

    constructor(public client: PteroClient) {
        super(client, {});

        this.isAdmin = false;
        this.tokens = [];
        this.apikeys = [];
    }

    /**
     * Returns a formatted URL to the client account.
     * @returns The formatted URL.
     */
    get panelURL(): string {
        return `${this.client.domain}/account`;
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

    /**
     * Updates the email for the account.
     * @param email The new email.
     * @param password The password for the account.
     * @returns The updated account instance.
     */
    async updateEmail(email: string, password: string): Promise<this> {
        if (this.email === email) return Promise.resolve(this);
        await this.client.requests.put(endpoints.account.email, {
            email,
            password,
        });
        this.email = email;
        return this;
    }

    /**
     * Updates the password for the account.
     * Note: the password is **not** stored in the account instance.
     * @param oldPass The account's current password.
     * @param newPass The new password for the account.
     * @returns The updated account instance (no change).
     */
    async updatePassword(oldPass: string, newPass: string): Promise<this> {
        if (oldPass === newPass) return Promise.resolve(this);
        await this.client.requests.put(endpoints.account.password, {
            current_password: oldPass,
            password: newPass,
            password_confirmation: newPass,
        });
        return this;
    }

    /**
     * Fetches the 2FA image URL code.
     * @returns The two-factor image URL code.
     */
    async get2FACode(): Promise<string> {
        const data = await this.client.requests.get(endpoints.account.tfa);
        return data.data.image_url_data;
    }

    /**
     * Enables 2FA for the account.
     * @param code The 2FA code.
     * @returns A list of 2FA codes.
     */
    async enable2FA(code: string): Promise<string[]> {
        const data = await this.client.requests.post(endpoints.account.tfa, {
            code,
        });
        this.tokens.push(...data.attributes.tokens);
        return this.tokens;
    }

    /**
     * Disables 2FA on the account and removes existing authentication tokens.
     * @param password The account password.
     */
    async disable2FA(password: string): Promise<void> {
        await this.client.requests.delete(endpoints.account.tfa, { password });
        this.tokens = [];
    }

    /** @returns A list of API keys associated with the account. */
    async fetchKeys(): Promise<APIKey[]> {
        const data = await this.client.requests.get(
            endpoints.account.apikeys.main,
        );
        this.apikeys = data.data.map((o: any) => {
            let k = caseConv.toCamelCase<APIKey>(o.attributes);
            k.createdAt = new Date(k.createdAt);
            k.lastUsedAt &&= new Date(k.lastUsedAt);
            return k;
        });
        return this.apikeys;
    }

    /**
     * Creates an API key associated with the account.
     * @param description The description (or memo) for the key.
     * @param allowedIps A list of IP addresses that can use this key.
     * @returns The new API key.
     */
    async createKey(
        description: string,
        allowedIps: string[] = [],
    ): Promise<APIKey> {
        const data = await this.client.requests.post(
            endpoints.account.apikeys.main,
            { description, allowed_ips: allowedIps },
        );

        const key = caseConv.toCamelCase<APIKey>(data.attributes);
        key.createdAt = new Date(key.createdAt);
        key.lastUsedAt &&= new Date(key.lastUsedAt);
        key.token = data.meta.secret_token;

        this.apikeys.push(key);
        return key;
    }

    /**
     * Deletes an API key from the account.
     * @param id The identifier of the key.
     */
    async deleteKey(id: string): Promise<void> {
        await this.client.requests.delete(endpoints.account.apikeys.get(id));
        this.apikeys = this.apikeys.filter((k) => k.identifier !== id);
    }

    /** @returns A list of activity logs on the account. */
    async fetchActivities(): Promise<Activity[]> {
        const data = await this.client.requests.get(endpoints.account.activity);
        const act = data.data.map((o: any) => {
            const a = caseConv.toCamelCase<Activity>(o.attributes);
            a.timestamp = new Date(a.timestamp);
            return a;
        });
        return act;
    }

    /** @returns A list of SSH keys associated with the account. */
    async fetchSSHKeys(): Promise<SSHKey[]> {
        const data = await this.client.requests.get(
            endpoints.account.sshkeys.main,
        );
        const keys = data.data.map((o: any) => {
            const k = caseConv.toCamelCase<SSHKey>(o.attributes);
            k.createdAt = new Date(k.createdAt);
            return k;
        });
        return keys;
    }

    /**
     * Creates an SSH key associated with the account.
     * @param name The name of the key.
     * @param publicKey The public key to authorize.
     * @returns The new SSH key.
     */
    async createSSHKey(name: string, publicKey: string): Promise<SSHKey> {
        const data = await this.client.requests.post(
            endpoints.account.sshkeys.main,
            { name, public_key: publicKey },
        );
        const key = caseConv.toCamelCase<SSHKey>(data.attributes);
        key.createdAt = new Date(key.createdAt);
        return key;
    }

    /**
     * Removes an SSH key from the account.
     * @param fingerprint The fingerprint of the SSH key.
     */
    async removeSSHKey(fingerprint: string): Promise<void> {
        await this.client.requests.post(endpoints.account.sshkeys.remove, {
            fingerprint,
        });
    }
}
