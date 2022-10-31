import { FetchOptions, PaginationMeta } from "../common";
import { BaseManager } from "./BaseManager";
import { Dict } from "./Dict";

export abstract class BaseManagerFetchAll<T extends unknown[], K, E> extends BaseManager {
    abstract meta: PaginationMeta;

    async fetchAll(...options: T): Promise<Dict<K, E>> {
        type Data = Dict<K, E>;
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
