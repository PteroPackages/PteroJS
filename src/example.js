// Example NodeStatus setup, feel free to customise how you like
const { NodeStatus } = require('.');

const client = new NodeStatus({
    domain: 'PTERO_DOMAIN',
    auth: 'PTERO_APPLICATION_API_KEY',
    nodes: [2, 3], // The IDs of the nodes to listen for
    callInterval: 60, // The interval in seconds between API calls
    retryLimit: 2 // The number of times to retry on unsuccessful calls
});

// Emitted when a connection is made to a node
client.on('connect', id => console.log(`Connected to node ${id}!`));

// Emitted when the connection is lost or unavailable
client.on('disconnect', id => console.log(`Disconnected from node ${id}.`));

// Emitted with the node data per interval
client.on('interval', data => {
    const { id, name, memory, disk } = data;
    console.log(`
        Node Information:
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
// - client.onInterval
//
// The events will be emitted first before the function is called
// for all of these properties.

// Finally, connect to the API and listen for events
client.connect();
