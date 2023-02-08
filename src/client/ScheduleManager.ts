import type { PteroClient } from '.';
import { CreateScheduleOptions } from '../common/client';
import { Dict } from '../structures/Dict';
import { FetchOptions } from '../common';
import { Schedule } from '../structures/Schedule';
import { ValidationError } from '../structures/Errors';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ScheduleManager {
    public cache: Dict<string, Dict<number, Schedule>>;

    constructor(public client: PteroClient) {
        this.cache = new Dict();
    }

    /**
     * Transforms the raw schedule object(s) into class objects.
     * @param data The resolvable schedule object(s).
     * @returns The resolved schedule object(s).
     */
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
     * Fetches a schedule from the API by its ID. This will check the cache first unless the force
     * option is specified.
     *
     * @param server The identifier of the server.
     * @param id The ID of the schedule.
     * @param [options] Additional fetch options.
     * @returns The fetched schedule.
     * @example
     * ```
     * client.schedules.fetch('411d2eb9', 12)
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(
        server: string,
        id: number,
        options?: FetchOptions,
    ): Promise<Schedule>;
    /**
     * Fetches a list of schedules from the API with the given options (default is undefined).
     *
     * @param server The identifier of the server.
     * @param [options] Additional fetch options.
     * @returns The fetched schedule.
     * @example
     * ```
     * client.schedules.fetch('411d2eb9', { perPage: 10 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(
        server: string,
        options?: FetchOptions,
    ): Promise<Dict<number, Schedule>>;
    async fetch(
        server: string,
        op1?: number | FetchOptions,
        op2: FetchOptions = {},
    ): Promise<any> {
        let path = endpoints.servers.schedules.main(server);
        if (typeof op1 === 'number') {
            if (!op2.force && this.cache.get(server)?.has(op1))
                return this.cache.get(server)!.get(op1);

            path = endpoints.servers.schedules.get(server, op1);
        } else {
            if (op1) op2 = op1;
        }

        const data = await this.client.requests.get(path, op2);
        return this._patch(server, data);
    }

    /**
     * Creates a schedule for a specified server.
     * @see {@link CreateScheduleOptions}.
     *
     * @param server The identifier of the server.
     * @param options Create schedule options.
     * @returns The new schedule.
     * @example
     * ```
     * client.schedules.create(
     *  '411d2eb9',
     *  {
     *   name: 'Weekly backup',
     *   active: false,
     *   month: '1',
     *   hour: '*',
     *   minute: '*'
     *  }
     * )
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async create(
        server: string,
        options: CreateScheduleOptions,
    ): Promise<Schedule> {
        options.dayOfWeek ||= '*';
        options.dayOfMonth ||= '*';
        options.onlyWhenOnline ??= false;

        const payload = caseConv.toSnakeCase(options, {
            map: { active: 'is_active' },
        });

        const data = await this.client.requests.post(
            endpoints.servers.schedules.main(server),
            payload,
        );
        return this._patch(server, data);
    }

    /**
     * Updates a schedule on the specified server.
     * @see {@link CreateScheduleOptions}.
     *
     * @param server The identifier of the server.
     * @param id The ID of the schedule.
     * @param options Update schedule options.
     * @returns The updated schedule.
     * @example
     * ```
     * client.schedules.update('411d2eb9', 5, { onlyWhenOnline: true })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async update(
        server: string,
        id: number,
        options: Partial<CreateScheduleOptions>,
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
        options.onlyWhenOnline ??= false;

        const data = await this.client.requests.patch(
            endpoints.servers.schedules.get(server, id),
            caseConv.toSnakeCase(options),
        );
        return this._patch(server, data);
    }

    /**
     * Deletes a schedule from a specified server.
     * @param server The identifier of the server.
     * @param id The ID of the schedule.
     * @example
     * ```
     * client.schedules.delete('411d2eb9', 3).catch(console.error);
     * ```
     */
    async delete(server: string, id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.schedules.get(server, id),
        );
        this.cache.get(server)?.delete(id);
    }
}
