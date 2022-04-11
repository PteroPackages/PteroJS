import { FetchOptions, Include, Sort, FilterArray } from '../common';
export type AllowedQueryOptions = {
    filters:    readonly string[];
    includes:   readonly string[];
    sorts:      readonly string[];
}

/**
 * Parses an array of arguments into a Pterodactyl query string.
 * @param args The args to parse into the query.
 * @param allowed Allowed argument guards.
 * @returns The parsed query.
 */
export const buildQuery = (
    args: FilterArray<Include<Sort<FetchOptions>>>,
    allowed: AllowedQueryOptions
): string => {
    const parsed: string[] = [];

    if (args.page) {
        if (args.page < 1 || args.page > 50)
            throw new RangeError('Page query must be between 1 and 50.');

        parsed.push(`page=${args.page}`);
    }

    if (args.perPage) {
        if (args.perPage < 1 || args.perPage > 100)
            throw new RangeError('PerPage query must be between 1 and 100.');

        parsed.push(`per_page=${args.perPage}`);
    }

    if (args.filter) {
        if (!allowed.filters?.includes(args.filter[0]))
            throw new SyntaxError(`Invalid filter argument '${args.filter[0]}'.`);

        parsed.push(`filter[${args.filter[0]}]=${args.filter[1]}`);
    }

    if (args.include) {
        for (const arg of args.include) {
            if (!allowed.includes.includes(arg))
                throw new SyntaxError(`Invalid include argument '${arg}'.`);
        }
        parsed.push(`include=${args.include}`);
    }

    if (args.sort) {
        if (!allowed.sorts.includes(args.sort))
            throw new SyntaxError(`Invalid sort argument '${args.sort}'.`);

        parsed.push(`sort=${args.sort}`);
    }

    if (!parsed.length) return '';
    return '?' + parsed.join('&');
}
