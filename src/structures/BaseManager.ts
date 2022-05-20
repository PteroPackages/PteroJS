export abstract class BaseManager {
    abstract get FILTERS(): readonly string[];
    abstract get SORTS(): readonly string[];
    abstract get INCLUDES(): readonly string[];

    getQueryOptions() {
        return {
            filters: this.FILTERS ?? [],
            sorts: this.SORTS ?? '',
            includes: this.INCLUDES ?? []
        }
    }
}
