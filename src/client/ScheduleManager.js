const Schedule = require('../structures/Schedule');
const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class ScheduleManager {
    constructor(client) {
        this.client = client;

        /** @type {Dict<string, Dict<number, Schedule>>} */
        this.cache = new Dict();
    }

    _patch(id, data) {
        if (data.data) {
            const res = new Dict();
            for (const o of data.data) {
                const s = new Schedule(this.client, id, o);
                res.set(s.id, s);
            }

            let c = this.cache.get(id);
            if (c) res.forEach((v, k) => c.set(k, v)); else c = res;
            this.cache.set(id, c);
            return res;
        }

        const s = new Schedule(this.client, id, data);
        let c = this.cache.get(id);
        if (c) c.set(s.id, s); else c = new Dict().set(s.id, s);
        this.cache.set(id, c);
        return s;
    }

    /**
     * Returns a formatted URL to the schedule.
     * @param {string} id The identifier of the server.
     * @param {string|Schedule} schedule The schedule or identifier of the schedule.
     * @returns {string} The formatted URL.
     */
    panelURLFor(id, schedule) {
        if (schedule instanceof Schedule) return schedule.panelURL;
        return `${this.client.domain}/server/${id}/schedules/${schedule}`;
    }

    /**
     * Fetches a schedule or all schedules from a specified server (with optional cache check).
     * @param {string} server The identifier of the server.
     * @param {string} [id] The ID of the schedule.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<Schedule|Dict<number, Schedule>>} The fetched schedule(s).
     */
    async fetch(server, id, force) {
        if (id && !force) {
            const s = this.cache.get(server)?.get(id);
            if (s) return s;
        }

        const data = await this.client.requests.get(
            id
            ? endpoints.servers.schedules.get(id)
            : endpoints.servers.schedules.main
        );
        return this._patch(server, data);
    }

    /**
     * Creates a new schedule for a specified server.
     * @param {string} server The identifier of the server to create the schedule for.
     * @param {object} options Schedule creation options.
     * @param {string} options.name The name of the schedule.
     * @param {boolean} options.active Whether the schedule should be active when created.
     * @param {string} options.minute The minute interval (in cron syntax).
     * @param {string} options.hour The hour interval (in cron syntax).
     * @param {string} [options.dayOfWeek] The day of the week interval (in cron syntax).
     * @param {string} [options.dayOfMonth] The day of the month interval (in cron syntax).
     * @returns {Promise<Schedule>} The new schedule.
     */
    async create(server, options = {}) {
        if (Object.keys(options).length < 4)
            throw new Error('Missing required Schedule creation option.');

        const payload = {};
        payload.name = options.name;
        payload.is_active = options.active;
        payload.minute = options.minute;
        payload.hour = options.hour;
        payload.day_of_week = options.dayOfWeek || '*';
        payload.day_of_month = options.dayOfMonth || '*';

        const data = await this.client.requests.post(
            endpoints.servers.schedules.main(server), payload
        );
        return this._patch(data);
    }

    /**
     * Updates a schedule for a specified server.
     * @param {string} server The server identifier of the schedule.
     * @param {number} id The ID of the schedule.
     * @param {object} options Schedule creation options.
     * @param {string} [options.name] The name of the schedule.
     * @param {boolean} [options.active] Whether the schedule should be active when created.
     * @param {string} [options.minute] The minute interval (in cron syntax).
     * @param {string} [options.hour] The hour interval (in cron syntax).
     * @param {string} [options.dayOfWeek] The day of the week interval (in cron syntax).
     * @param {string} [options.dayOfMonth] The day of the month interval (in cron syntax).
     * @returns {Promise<Schedule>} The updated schedule instance.
     */
    async update(server, id, options = {}) {
        if (!Object.keys(options).length) throw new Error('Too few options to update.');
        const sch = await this.fetch(server, id);

        const payload = {};
        payload.name = options.name || sch.name;
        payload.is_active = options.active ?? sch.active;
        payload.minute = options.minute || sch.cron.minute;
        payload.hour = options.hour || sch.cron.hour;
        payload.day_of_week = options.dayOfWeek || sch.cron.week;
        payload.day_of_month = options.dayOfMonth || sch.cron.month;

        const data = await this.client.requests.post(
            endpoints.servers.schedules.get(server, id), payload
        );
        return this._patch(data);
    }

    /**
     * Deletes a schedule from a specified server.
     * @param {string} server The server identifier of the schedule.
     * @param {number} id The ID of the schedule.
     * @returns {Promise<boolean>}
     */
    async delete(server, id) {
        await this.client.requests.delete(
            endpoints.servers.schedules.get(server, id)
        );
        this.cache.get(server)?.delete(id);
        return true;
    }
}

module.exports = ScheduleManager;
