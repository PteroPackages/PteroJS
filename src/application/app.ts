import { ApplicationServerManager } from './ApplicationServerManager';
import { NestManager } from './NestManager';
import { NodeAllocationManager } from './NodeAllocationManager';
import { NodeLocationManager } from './NodeLocationManager';
import { NodeManager } from './NodeManager';
import { RestRequestManager } from '../http/RestRequestManager';
import { UserManager } from './UserManager';
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
export class PteroApp {
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

    public options: Record<string, OptionSpec>;

    public allocations: NodeAllocationManager;
    public locations: NodeLocationManager;
    public nests: NestManager;
    public nodes: NodeManager;
    public servers: ApplicationServerManager;
    public users: UserManager;
    public requests: RestRequestManager;

    constructor(
        domain: string,
        auth: string,
        options: Record<string, OptionSpec> = {}
    ) {
        if (!/https?\:\/\/(?:localhost\:\d{4}|[\w\.\-]{3,256})/gi.test(domain))
            throw new SyntaxError(
                "Domain URL must start with 'http://' or 'https://' and "+
                'must be bound to a port if using localhost.'
            );

        this.domain = domain;
        this.auth = auth;
        this.options = loader.appConfig({ application: options });

        this.allocations = new NodeAllocationManager(this);
        this.locations = new NodeLocationManager(this);
        this.nests = new NestManager(this);
        this.nodes = new NodeManager(this);
        this.servers = new ApplicationServerManager(this);
        this.users = new UserManager(this);
        this.requests = new RestRequestManager('Application', domain, auth);
    }

    get ping(): number {
        return this.requests._ping;
    }
}
