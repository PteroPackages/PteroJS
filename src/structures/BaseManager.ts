export abstract class BaseManager {
    abstract get FILTERS(): Readonly<string[]>;
    abstract get SORTS(): Readonly<string[]>;
    abstract get INCLUDES(): Readonly<string[]>;

    getQueryOptions() {
        return {
            filters: this.FILTERS ?? [],
            sorts: this.SORTS ?? '',
            includes: this.INCLUDES ?? []
        }
    }
}
