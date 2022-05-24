import type { PteroClient } from '.';
import { Dict } from '../structures/Dict';
import { Schedule } from '../structures/Schedule';
import { ValidationError } from '../structures/Errors';
import { FetchOptions } from '../common';
import { CreateScheduleOptions } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ScheduleManager {
    public cache: Dict<string, Dict<number, Schedule>>;

    constructor(public client: PteroClient) {
        this.cache = new Dict();
    }

    _patch(id: string, data: any): any {
        if (data.data) {
            const res = new Dict<number, Schedule>();
            for (let o of data.data) {
                const s = new Schedule(this.client, id, o.attributes);
                res.set(s.id, s);
            }
            const hold = (this.cache.get(id) || new Dict()).join(res);
            this.cache.set(id, hold);
            return res;
        }

        const s = new Schedule(this.client, id, data.attributes);
        const hold = (this.cache.get(id) || new Dict()).set(s.id, s);
        this.cache.set(id, hold);
        return s;
    }

    /**
     * Fetches a schedule or a list of schedules from the Pterodactyl API.
     * @param server The identifier of the server.
     * @param [id] The ID of the schedule.
     * @param [options] Additional fetch options.
     * @returns The fetched schedule(s).
     */
    async fetch<T extends number | undefined>(
        server: string,
        id?: T,
        options: FetchOptions = {}
    ): Promise<T extends undefined ? Dict<number, Schedule> : Schedule> {
        if (id && !options.force) {
            if (this.cache.get(server)?.has(id))
                return this.cache.get(server)!.get(id) as any;
        }

        const data = await this.client.requests.get(
            id
                ? endpoints.servers.schedules.get(server, id)
                : endpoints.servers.schedules.main(server),
            options
        );
        return this._patch(server, data);
    }

    /**
     * Creates a schedule for a specified server.
     * @param server The identifier of the server.
     * @param options Create schedule options.
     * @see {@link CreateScheduleOptions}.
     * @returns The new schedule.
     */
    async create(server: string, options: CreateScheduleOptions): Promise<Schedule> {
        options.dayOfWeek ||= '*';
        options.dayOfMonth ||= '*';
        const payload = caseConv.toSnakeCase(options, {
            map:{ active: 'is_active' }
        });

        const data = await this.client.requests.post(
            endpoints.servers.schedules.main(server), payload
        );
        return this._patch(server, data);
    }

    /**
     * Updates a schedule on the specified server.
     * @param server The identifier of the server.
     * @param id The ID of the schedule.
     * @param options Update schedule options.
     * @see {@link CreateScheduleOptions}.
     * @returns The updated schedule.
     */
    async update(
        server: string,
        id: number,
        options: Partial<CreateScheduleOptions>
    ): Promise<Schedule> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update schedule.');

        const s = await this.fetch(server, id);
        options.name ||= s.name;
        options.active ||= s.active;
        options.hour ||= s.cron.hour;
        options.minute ||= s.cron.minute;
        options.dayOfWeek ||= s.cron.dayOfWeek;
        options.dayOfMonth ||= s.cron.dayOfMonth;

        const data = await this.client.requests.patch(
            endpoints.servers.schedules.get(server, id),
            caseConv.toSnakeCase(options)
        );
        return this._patch(server, data);
    }

    /**
     * Deletes a schedule from a specified server.
     * @param server The identifier of the server.
     * @param id The ID of the schedule.
     */
    async delete(server: string, id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.schedules.get(server, id)
        );
        this.cache.get(server)?.delete(id);
    }
}
