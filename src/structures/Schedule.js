class Schedule {
    constructor(client, server, data) {
        this.client = client;
        this.server = server;
        data = data.attributes;

        /**
         * The ID of the schedule.
         * @type {number}
         */
        this.id = data.id;

        /**
         * The name of the schedule.
         * @type {string}
         */
        this.name = data.name;

        /**
         * An object containing cronjob details.
         * @type {object}
         */
        this.cron = {
            /**
             * @type {string}
             */
            week: data.cron.day_of_week,

            /**
             * @type {string}
             */
            month: data.crong.day_of_month,

            /**
             * @type {string}
             */
            hour: data.cron.hour,

            /**
             * @type {string}
             */
            minute: data.cron.minute
        }

        /**
         * Whether the schedule is active.
         * @type {boolean}
         */
        this.active = data.is_active;

        /**
         * Whether the schedule is currently processing tasks.
         * @type {boolean}
         */
        this.processing = data.is_processing;

        /**
         * The last recorded date the schedule was ran at.
         * @type {?Date}
         */
        this.lastRunAt = data.last_run_at ? new Date(data.last_run_at) : null;

        /**
         * The date of the next scheduled run.
         * @type {Date}
         */
        this.nextRunAt = new Date(data.next_run_at);

        /**
         * The date the schedule was created.
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * The date the schedule was last updated.
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;

        /** @type {Set<ScheduleTask>} */
        this.tasks = new Set();
    }

    /** @todo */
    async update(options = {}) {}

    /** @todo */
    async createTask(action, payload, offset) {}

    /** @todo */
    async updateTask(id, options = {}) {}

    /** @todo */
    async deleteTask(id) {}

    /** @todo */
    async delete() {}
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
