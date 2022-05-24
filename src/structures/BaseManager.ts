export abstract class BaseManager {
    abstract get FILTERS(): readonly string[];
    abstract get SORTS(): readonly string[];
    abstract get INCLUDES(): readonly string[];

    /**
     * Gets the allowed query options from the inherited manager.
     * @returns The query options.
     * @internal
     */
    getQueryOptions() {
        return {
            filters: this.FILTERS,
            sorts: this.SORTS,
            includes: this.INCLUDES
        }
    }
}
