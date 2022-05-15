import { Account } from '../structures/User';
import { ClientServerManager } from './ClientServerManager';
import { RequestManager } from '../http/RequestManager';
import { WebSocketManager } from './ws/WebSocketManager';
import { OptionSpec } from '../common';
import loader from '../util/config';

export class PteroClient {
    public domain: string;
    public auth: string;
    public options: Record<string, OptionSpec>;
    public account: Account;

    public servers: ClientServerManager;
    public requests: RequestManager;
    public ws: WebSocketManager;

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
        this.options = loader.clientConfig({ client: options });
        this.account = new Account(this);

        this.servers = new ClientServerManager(this);
        this.requests = new RequestManager('Client', domain, auth);
        this.ws = new WebSocketManager(this);
    }

    get ping(): number {
        return this.requests._ping;
    }
}
