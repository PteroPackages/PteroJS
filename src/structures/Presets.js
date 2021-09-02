const { ApplicationOptions } = require('../application/PteroApp');

/**
 * Creates a preset application option object with all the options not
 * specified by the user.
 * @param {ApplicationOptions} data Data to parse application options from.
 * @returns {ApplicationOptions}
 */
function application(data) {
    if (typeof data !== 'object') throw new TypeError('Invalid client options object.');

    data.fetchUsers ??= false;
    data.fetchNodes ??= false;
    data.fetchNests ??= false;
    data.fetchServers ??= false;
    data.fetchLocations ??= false;

    data.cacheUsers ??= true;
    data.cacheNodes ??= true;
    data.cacheNests ??= true;
    data.cacheServers ??= true;
    data.cacheLocations ??= true;

    return data;
}

exports.application = application;
