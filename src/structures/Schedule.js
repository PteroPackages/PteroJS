const Dict = require('./Dict');
const endpoints = require('../client/endpoints');

class Schedule {
    constructor(client, serverId, data) {
        this.client = client;
        this.serverId = serverId;

        /** @type {Dict<number, ScheduleTask>} */
        this.tasks = new Dict();
        data = data.attributes;

        /**
         * The ID of the schedule.
         * @type {number}
         */
        this.id = data.id;
        /**
             * The date the schedule was created.
             * @type {Date}
             */
        this.createdAt = new Date(data.created_at);

        this._patch(data);
    }

    _patch(data) {
        if ('name' in data) {
            /**
             * The name of the schedule.
             * @type {string}
             */
            this.name = data.name;
        }

        if ('cron' in data) {
            /**
             * An object containing cronjob details.
             * @type {object}
             */
            this.cron = {
                /** @type {string} */
                week: data.cron.day_of_week,

                /** @type {string} */
                month: data.cron.day_of_month,

                /** @type {string} */
                hour: data.cron.hour,

                /** @type {string} */
                minute: data.cron.minute
            }
        }

        if ('is_active' in data) {
            /**
             * Whether the schedule is active.
             * @type {boolean}
             */
            this.active = data.is_active;
        }

        if ('is_processing' in data) {
            /**
             * Whether the schedule is currently processing tasks.
             * @type {boolean}
             */
            this.processing = data.is_processing;
        }

        if ('last_run_at' in data) {
            /**
             * The last recorded date the schedule was ran at.
             * @type {?Date}
             */
            this.lastRunAt = data.last_run_at ? new Date(data.last_run_at) : null;
        }

        if ('next_run_at' in data) {
            /**
             * The date of the next scheduled run.
             * @type {Date}
             */
            this.nextRunAt = new Date(data.next_run_at);
        }

        if ('updated_at' in data) {
            /**
             * The date the schedule was last updated.
             * @type {?Date}
             */
            this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
        }

        if ('relationships' in data) {
            for (const obj of data.relationships.tasks.data) {
                this._resolveTask(obj);
            }
        }
    }

    _resolveTask(data) {
        if (data.attributes) data = data.attributes;
        const obj = {
            id: data.id,
            sequenceId: data.sequence_id,
            action: data.action,
            payload: data.payload,
            offset: data.time_offset,
            queued: data.is_queued,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : null
        }

        this.tasks.set(obj.id, obj);
        return obj;
    }

    /**
     * Returns a formatted URL to the schedule.
     * @returns {string} The formatted URL.
     */
    get panelURL() {
        return `${this.client.domain}/server/${this.serverId}/schedules/${this.id}`;
    }

    /**
     * Updates the schedule.
     * @param {object} options Schedule update options.
     * @param {string} [options.name] The name of the schedule.
     * @param {boolean} [options.active] Whether the schedule is active.
     * @param {string} [options.minute] The minute interval (in cron syntax).
     * @param {string} [options.hour] The hour interval (in cron syntax).
     * @param {string} [options.dayOfWeek] The day of the week interval (in cron syntax).
     * @param {string} [options.dayOfMonth] The day of the month interval (in cron syntax).
     * @returns {Promise<Schedule>} The updated Schedule instance.
     */
    async update(options = {}) {
        return this.client.schedules.update(this.serverId, this.id, options);
    }

    /**
     * Creates a new task for the schedule.
     * @param {string} action The type of action that will be executed.
     * @param {string} payload The payload to invoke the task with.
     * @param {string} offset The task offest (in seconds).
     * @returns {Promise<ScheduleTask>} The new schedule task.
     */ 
    async createTask(action, payload, offset) {
        if (!['command', 'power', 'backup'].includes(action))
            throw new TypeError('Invalid task action type.');

        const data = await this.client.requests.post(
            endpoints.servers.schedules.tasks.main(this.serverId, this.id),
            { action, payload, time_offset: offset }
        );
        return this._resolveTask(data);
    }

    /**
     * Updates an existing task for the schedule.
     * @param {number} id The ID of the schedule task.
     * @param {object} options Schedule task edit options.
     * @param {string} options.action The type of action that will be executed.
     * @param {string} options.payload The payload to invoke the task with.
     * @param {string} options.offset The task offest (in seconds).
     * @returns {Promise<ScheduleTask>} The updated schedule task.
     */ 
    async updateTask(id, options = {}) {
        if (Object.keys(options).length < 3)
            throw new Error('Missing required ScheduleTask update options.');

        if (!['command', 'power', 'backup'].includes(options.action))
            throw new TypeError('Invalid task action type.');

        options.time_offset = options.offset;
        const data = await this.client.requests.post(
            endpoints.servers.schedules.tasks.get(this.serverId, this.id, id),
            options
        );
        return this._resolveTask(data);
    }

    /**
     * Deletes a specified task from the schedule.
     * @param {number} id The ID of the schedule task.
     * @returns {Promise<boolean>}
     */
    async deleteTask(id) {
        await this.client.requests.delete(
            endpoints.servers.schedules.tasks.get(this.serverId, this.id, id)
        );
        this.tasks.delete(id);
        return true;
    }

    /**
     * Deletes the schedule from the server.
     * @returns {Promise<boolean>}
     */
    async delete() {
        return this.client.schedules.delete(this.serverId, this.id);
    }
}

module.exports = Schedule;

/**
 * Represents a schedule task.
 * @typedef {object} ScheduleTask
 * @property {number} id The ID of the task.
 * @property {number} sequenceId The ID of the current sequence.
 * @property {string} action The action for this task.
 * @property {string} payload
 * @property {number} offset
 * @property {boolean} queued Whether the task is queued in the schedule.
 * @property {Date} createdAt The date the task was created.
 * @property {?Date} updatedAt The date the task was last updated.
 */
