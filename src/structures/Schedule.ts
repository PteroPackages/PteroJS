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
    /** The ID of the schedule. */
    public readonly id: number;

    /** The date the schedule was created. */
    public readonly createdAt: Date;

    /** The name of the schedule. */
    public name: string;

    /** The schedule cronjob data. */
    public cron: Cron;

    /** Whether the schedule is active. */
    public active: boolean;

    /** Whether the schedule is currently being processed. */
    public processing: boolean;

    /** Whether the schedule should only run when the server is online. */
    public onlyWhenOnline: boolean;

    /** The date the schedule was last updated. */
    public updatedAt: Date | undefined;

    /** The date the schedule last ran. */
    public lastRunAt: Date | undefined;

    /** The date the scheduls is supposed to run next. */
    public nextRunAt: Date;

    /** A dict of tasks that will be executed when the schedule is running. */
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
                data.relationships.tasks.data.forEach(
                    (t: any) => this._resolveTask(t)
                );
        }
    }

    _resolveTask(data: any): ScheduleTask {
        const t = caseConv.toCamelCase<ScheduleTask>(data.attributes, {
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

    /** Executes the schedule immediately. */
    async execute(): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.schedules.exec(this.serverId, this.id)
        );
        this.processing = true;
    }

    /**
     * Updates the schedule with the specified options.
     * @param options Update schedule options.
     * @see {@link CreateScheduleOptions UpdateScheduleOptions}.
     * @returns The updated instance.
     */
    async update(options: CreateScheduleOptions): Promise<this> {
        const data = await this.client.schedules.update(this.serverId, this.id, options);
        this._patch(data.toJSON());
        return this;
    }

    /**
     * Creates a task on the schedule.
     * @param action The action the task will perform.
     * @param payload The task payload.
     * @param offset The execution time offset.
     * @returns The new task.
     */
    async createTask(
        action: ScheduleTaskAction,
        payload: string,
        offset: number,
        sequenceId?: number
    ): Promise<ScheduleTask> {
        const data = await this.client.requests.post(
            endpoints.servers.schedules.tasks.main(this.serverId, this.id),
            { action, payload, time_offset: offset, sequence_id: sequenceId }
        );
        return this._resolveTask(data);
    }

    /**
     * Updates a specified task in the schedule.
     * @param id The ID of the task.
     * @param options Update task options.
     * @returns The updated task.
     */
    async updateTask(
        id: number,
        options:{
            action: ScheduleTaskAction,
            payload: string,
            offset: number
        }
    ): Promise<ScheduleTask> {
        if (!Object.keys(options).length)
            throw new Error('Too few options to update schedule task.');

        const payload = caseConv.toSnakeCase(
            options, { map:{ offset: 'time_offset' }}
        );
        const data = await this.client.requests.post(
            endpoints.servers.schedules.tasks.get(this.serverId, this.id, id),
            payload
        );
        return this._resolveTask(data);
    }

    /**
     * Deletes a task from the schedule.
     * @param id The ID of the task.
     */
    async deleteTask(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.schedules.tasks.get(this.serverId, this.id, id)
        );
        this.tasks.delete(id);
    }

    /**
     * Converts the schedule into a JSON object, relative to the API
     * response object.
     * @returns The JSON object.
     */
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

    /** @returns The string representation of the schedule. */
    toString(): string {
        return this.name;
    }
}
