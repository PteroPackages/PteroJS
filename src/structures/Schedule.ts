import type { PteroClient } from '../client';
import { Dict } from './Dict';
import {
    Cron,
    ScheduleTask,
    ScheduleTaskAction,
    CreateScheduleOptions
} from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from '../client/endpoints';

export class Schedule {
    public readonly id: number;
    public readonly createdAt: Date;

    public name: string;

    public cron: Cron;

    public active: boolean;

    public processing: boolean;

    public onlyWhenOnline: boolean;

    public updatedAt: Date | undefined;

    public lastRunAt: Date | undefined;

    public nextRunAt: Date;

    public tasks: Dict<number, ScheduleTask>;

    constructor(
        public client: PteroClient,
        public serverId: string,
        data: any
    ) {
        this.id = data.id;
        this.createdAt = new Date(data.created_at);
        this.tasks = new Dict();

        this._patch(data);
    }

    _patch(data: any): void {
        if ('name' in data) this.name = data.name;
        if ('cron' in data) this.cron = caseConv.toCamelCase(data.cron);
        if ('is_active' in data) this.active = data.is_active;
        if ('is_processing' in data) this.processing = data.is_processing;
        if ('only_when_online' in data) this.onlyWhenOnline = data.only_when_online;
        if ('updated_at' in data) this.updatedAt = new Date(data.updated_at);
        if ('last_run_at' in data) this.lastRunAt = new Date(data.last_run_at);
        if('next_run_at' in data) this.nextRunAt = new Date(data.next_run_at);
        if ('relationships' in data) {
            if ('tasks' in data.relationships)
                data.relationships.tasks.data.forEach(this._resolveTask);
        }
    }

    _resolveTask(data: any): ScheduleTask {
        const t = caseConv.toCamelCase<ScheduleTask>(data, {
            map:{
                time_offset: 'offset',
                is_queued: 'queued'
            }
        });
        t.createdAt = new Date(t.createdAt);
        t.updatedAt &&= new Date(t.updatedAt);

        this.tasks.set(t.id, t);
        return t;
    }

    async update(options: CreateScheduleOptions): Promise<this> {
        const data = await this.client.schedules.update(this.serverId, this.id, options);
        this._patch(data.toJSON());
        return this;
    }

    async createTask(
        action: ScheduleTaskAction,
        payload: string,
        offset: number
    ): Promise<ScheduleTask> {
        const data = await this.client.requests.post(
            endpoints.servers.schedules.tasks.main(this.serverId, this.id),
            { action, payload, time_offset: offset }
        );
        return this._resolveTask(data);
    }

    async updateTask(
        id: number,
        options:{
            actions?: ScheduleTaskAction,
            payload?: string,
            offset?: number
        }
    ): Promise<ScheduleTask> {
        if (!Object.keys(options).length)
            throw new Error('Too few options to update schedule task.');

        const data = await this.client.requests.post(
            endpoints.servers.schedules.tasks.get(this.serverId, this.id, id),
            options
        );
        return this._resolveTask(data);
    }

    async deleteTask(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.schedules.tasks.get(this.serverId, this.id, id)
        );
        this.tasks.delete(id);
    }

    async delete(): Promise<void> {
        await this.client.schedules.delete(this.serverId, this.id);
    }

    toJSON(): object {
        const o = caseConv.toSnakeCase<any>(this, {
            ignore:['client', 'cron']
        });
        o.cron = caseConv.toSnakeCase(this.cron, {
            map:{
                week: 'day_of_week',
                month: 'day_of_month'
            }
        });
        return o;
    }
}
