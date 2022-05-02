import fetch from 'node-fetch';
import { EventEmitter } from 'events';
import type { BaseManager } from '../structures/BaseManager';
import { APIErrorResponse, PteroAPIError, RequestError } from '../structures/Errors';
import { FetchOptions } from '../common';
import { buildQuery } from '../util/query';
import { version } from '../../package.json';

export type Method =
    | 'GET'
    | 'POST'
    | 'PATCH'
    | 'PUT'
    | 'DELETE';

export class RestRequestManager extends EventEmitter {
    private _type: string;
    public _domain: string;
    public _auth: string;
    public _ping: number;

    constructor(type: string, domain: string, auth: string) {
        super();

        this._type = type;
        this._domain = domain;
        this._auth = auth;
        this._ping = -1;
    }

    getHeaders(): Record<string, string> {
        return {
            'User-Agent': `${this._type} PteroJS v${version}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this._auth}`
        }
    }

    private debug(message: string): void {
        super.emit('debug', message);
    }

    async _make(
        path: string,
        params: object | undefined,
        method: Method
    ): Promise<object | Buffer | void> {
        let body = undefined;
        if (params !== undefined) {
            if ('raw' in params) body = (params as { raw: string }).raw;
            else body = JSON.stringify(params);
        }

        this.debug(
            `fetching: ${method} ${this._domain}/api/${this._type.toLowerCase()}${path}`
        );
        const start = Date.now();
        const res = await fetch(
            `${this._domain}/api/${this._type.toLowerCase()}${path}`,
            {
                method,
                body,
                headers: this.getHeaders()
            }
        );
        this._ping = Date.now() - start;
        this.debug(`received status: ${res.status} (${this._ping}ms)`);

        if ([202, 204].includes(res.status)) return;
        let data: object | Buffer;

        if (res.headers.get('content-type') === 'application/json') {
            data = await res.json().catch(null);
        } else {
            data = await res.buffer().catch(null);
        }

        if (data) {
            super.emit('receive', data);
            if (res.ok) return data;
            if (res.status >= 400 && res.status < 500)
                throw new PteroAPIError(data as APIErrorResponse);
        }

        throw new RequestError(
            'Pterodactyl API returned an invalid or unacceptable response '+
            `(status: ${res.status})`
        );
    }

    async get(
        path: string,
        params: FetchOptions,
        cls?: BaseManager
    ): Promise<object | Buffer> {
        const query = buildQuery(params, cls?.getQueryOptions() || {} as any);
        return this._make(path + query, undefined, 'GET') as object | Buffer;
    }

    async post(path: string, data: object = {}) {
        return this._make(path, data, 'POST');
    }

    async patch(path: string, data: object = {}) {
        return this._make(path, data, 'PATCH');
    }

    async put(path: string, data: object = {}) {
        return this._make(path, data, 'PUT');
    }

    async delete(path: string): Promise<void> {
        return this._make(path, undefined, 'DELETE') as Promise<void>;
    }
}
