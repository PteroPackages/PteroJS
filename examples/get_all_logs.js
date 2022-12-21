const { PteroClient } = require('@devnote-dev/pterojs');

const client = new PteroClient('https://pterodactyl.test', 'ptlc_nkan3orij9fjewfio4fni34nf4');
const shard = client.addSocketServer('f0e206ca');

// Sends a request for logs after authorising
shard.on('authSuccess', () => shard.send('send logs'));

// Writes all the incoming logs to the console
shard.on('consoleOutput', console.log);

// Connects the shard to the server websocket
shard.connect();
