const { ApplicationOptions } = require('../application/PteroApp');
const { ClientOptions } = require('../client/PteroClient');

/**
 * Creates a preset application option object with all the options not
 * specified by the user.
 * @param {object} data Data to parse application options from.
 * @returns {ApplicationOptions}
 * @deprecated Use configLoader util instead.
 */
function application(data) {
    if (typeof data !== 'object') throw new TypeError('Invalid application options object.');

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

/**
 * Creates a preset client option object with all the options not
 * specified by the user.
 * @param {object} data Data to parse client options from.
 * @returns {ClientOptions}
 * @deprecated Use configLoader util instead.
 */
function client(data) {
    if (typeof data !== 'object') throw new TypeError('Invalid client options object.');

    data.ws ??= false;
    data.fetchClient ??= true;
    data.fetchServers ??= false;
    data.cacheServers ??= true;
    data.cacheSubUsers ??= true;
    data.disableEvents ??= [];

    return data;
}

exports.application = application;
exports.client = client;
