import type ApplicationServer from './ApplicationServer';
import type Dict from './Dict';
import type PteroApp from '../application/app';
import { DaemonData, NodeLocation } from '../common';

export default class Node {
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

    public maintainance: boolean;

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

    public _patch(data: any): void {}
}
