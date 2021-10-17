// Example NodeStatus setup, feel free to customise how you like
const { NodeStatus } = require('.');

const client = new NodeStatus({
    name: 'NODE_NAME',
    domain: 'PTERO_DOMAIN',
    auth: 'PTERO_APPLICATION_API_KEY',
    interval: 60, // The interval in seconds between status calls
    retryLimit: 2 // The number of times to retry on unsuccessful calls
});

// Emitted when a connection is made
client.on('connect', () => console.log(`Connected to node ${client.name}`));

// Emitted when the connection is lost or unavailable
client.on('disconnect', msg => console.log(`Node disconncted: ${msg}`));

// Emitted when there is an error during the process
client.on('error', console.error);

// Emitted with the node data per interval
client.on('interval', data => {
    const { id, name, memory, disk } = data;
    console.log(
        `Node Information:
        ID: ${id}
        Name: ${name}
        Memory: ${memory}MB
        Disk: ${disk}MB
    `);
});

// Additionally you can use manual client.on<event-name> properties
// which will operate the same way as the client.on() function:
// - client.onConnect
// - client.onDisconnect
// - client.onError
// - client.onInterval
//
// The events will be emitted first before the function is called
// for all of these properties.

// Finally, connect to the API and listen for events
client.connect();
