import { FetchOptions, PaginationMeta } from "../common";
import { ClientMeta } from "../common/client";
import { Dict } from "./Dict";
import { ValidationError } from "./Errors";

function isMetadata(meta: PaginationMeta | ClientMeta): meta is PaginationMeta {
    return (meta as PaginationMeta).totalPages !== undefined;
}

export abstract class BaseManager {
    declare meta: PaginationMeta | ClientMeta | undefined;

    abstract get FILTERS(): readonly string[];
    abstract get SORTS(): readonly string[];
    abstract get INCLUDES(): readonly string[];

    abstract fetch(...args: unknown[]): Promise<unknown>

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
    protected async getFetchAll<T, K>(...options: unknown[]): Promise<Dict<T, K>> {
        type Data = Dict<T, K>;

        if (!this.meta || !isMetadata(this.meta)) throw new ValidationError('No page metadata');

        // Last option should be FetchOptions
        if (typeof options[options.length - 1] != 'object') {
            options.push({ page: 1 })
        }

        const setPage = (page: number) => {
            (options[options.length - 1] as FetchOptions).page = page;
        }

        let data = await this.fetch(...options) as Data;
        if (this.meta.totalPages > 1) {
            for (let i = 2; i <= this.meta.totalPages; i++) {
                setPage(i);
                const page = await this.fetch(...options) as Data;
                data = data.join(page);
            }
        }
        return data;
    }
}
