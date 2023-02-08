import { FetchOptions, FilterArray, Include, Sort } from '../common';
import { ValidationError } from '../structures/Errors';
export interface AllowedQueryOptions {
    filters: readonly string[];
    includes: readonly string[];
    sorts: readonly string[];
}

/**
 * Parses an array of arguments into a Pterodactyl query string.
 * @param args The args to parse into the query.
 * @param allowed Allowed argument guards.
 * @returns The parsed query.
 */
export const buildQuery = (
    args: FilterArray<Include<Sort<FetchOptions>>>,
    allowed: AllowedQueryOptions,
): string => {
    const parsed: string[] = [];

    if (args.page) parsed.push(`page=${args.page}`);

    if (args.perPage && args.perPage > 0) {
        if (args.perPage > 100) args.perPage = 100;
        parsed.push(`per_page=${args.perPage}`);
    }

    if (args.filter) {
        if (!allowed.filters?.includes(args.filter[0]))
            throw new ValidationError(
                `Invalid filter argument '${args.filter[0]}'.`,
            );

        parsed.push(`filter[${args.filter[0]}]=${args.filter[1]}`);
    }

    if (args.include) {
        for (const arg of args.include) {
            if (!allowed.includes.includes(arg))
                throw new ValidationError(`Invalid include argument '${arg}'.`);
        }
        if (args.include?.length) parsed.push(`include=${args.include}`);
    }

    if (args.sort) {
        if (!allowed.sorts.includes(args.sort))
            throw new ValidationError(`Invalid sort argument '${args.sort}'.`);

        parsed.push(`sort=${args.sort}`);
    }

    if (!parsed.length) return '';
    return '?' + parsed.join('&');
};
