import RestRequestManager from '../http/RestRequestManager';
import { OptionSpec } from '../common';
import loader from '../util/config';

/**
 * The base class for the Pterodactyl application API.
 * This operates using a Pterodactyl application API key which can be found
 * at <your.domain.name/admin/api>.
 * 
 * **Warning:** Keep your API key private at all times. Exposing this can lead
 * to your servers, nodes, configurations and more being corrupted and/or deleted.
 */
export default class PteroApp {
    /**
     * The domain for your Pterodactyl panel. This should be the main URL only
     * (not "/api"). Any additional paths will count as the API path.
     */
    public domain: string;

    /**
     * The API key for your Pterodactyl panel. This should be kept private at
     * all times. Full access must be granted in the panel for the whole library
     * to be accessible.
     */
    public auth: string;

    public options: { [key: string]: OptionSpec };

    public requests: RestRequestManager;

    constructor(domain: string, auth: string, options: { [key: string]: any } = {}) {
        if (!/https?\:\/\/(?:localhost\:\d{4}|[\w\.\-]{3,256})/gi.test(domain))
            throw new SyntaxError(
                "Domain URL must start with 'http://' or 'https://' and "+
                'must be bound to a port if using localhost.'
            );

        this.domain = domain;
        this.auth = auth;
        this.options = loader.appConfig({ application: options });

        this.requests = new RestRequestManager('application', domain, auth);
    }
}
