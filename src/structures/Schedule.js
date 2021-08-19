class Schedule {
    constructor(client, data) {
        this.client = client;
        data = data.attributes;

        /**
         * @type {number}
         */
        this.id = data.id;

        /**
         * @type {string}
         */
        this.name = data.name;

        /**
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
         * @type {boolean}
         */
        this.active = data.is_active;

        /**
         * @type {boolean}
         */
        this.processing = data.is_processing;

        /**
         * @type {?Date}
         */
        this.lastRunAt = data.last_run_at ? new Date(data.last_run_at) : null;

        /**
         * @type {Date}
         */
        this.nextRunAt = new Date(data.next_run_at);

        /**
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;

        /**
         * @type {Set<ScheduleTask>}
         */
        this.tasks = new Set();
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
