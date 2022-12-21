import { FetchOptions, PaginationMeta } from '../common';
import { Dict } from './Dict';

export abstract class BaseManager {
    public meta: PaginationMeta = {
        current: 0,
        total: 0,
        count: 0,
        perPage: 0,
        totalPages: 0,
    };

    abstract get FILTERS(): readonly string[];
    abstract get SORTS(): readonly string[];
    abstract get INCLUDES(): readonly string[];

    abstract fetch(...args: unknown[]): Promise<unknown>;

    /**
     * Gets the allowed query options from the inherited manager.
     * @returns The query options.
     * @internal
     */
    getQueryOptions() {
        return {
            filters: this.FILTERS,
            sorts: this.SORTS,
            includes: this.INCLUDES,
        };
    }

    /**
     * Fetches rach page and joins the results.
     * @returns Dictionary of the specified types
     * @internal
     */
    protected async getFetchAll<T, K>(
        ...options: unknown[]
    ): Promise<Dict<T, K>> {
        // Last option should be FetchOptions
        const opts = (options[options.length - 1] || {
            page: 1,
        }) as FetchOptions;

        let data = (await this.fetch(...options)) as Dict<T, K>;
        if (this.meta.totalPages > 1) {
            for (let i = 2; i <= this.meta.totalPages; i++) {
                opts.page = i;
                let page = (await this.fetch(opts)) as Dict<T, K>;
                data.update(page);
            }
        }
        return data;
    }
}
