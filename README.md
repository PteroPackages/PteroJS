<h1 align="center">PteroJS</h1>
<h3 align="center"><strong>A better API wrapper for Pterodactyl</strong></h3>

[![discord](https://img.shields.io/badge/discord-5865f2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.com/invite/Qx2hyttRsU)
![version](https://img.shields.io/badge/version-1.0.0-3572A5?style=for-the-badge)
[![issues](https://img.shields.io/github/issues/devnote-dev/PteroJS.svg?style=for-the-badge)](https://github.com/devnote-dev/PteroJS/issues)

## About
PteroJS utilises the verbose classes structure seen in libraries like Discord.js to give developers the most amount of control over their code.

## Installing
*This package is not currently available on NPM so you have to download a zip of the repository to use.*
```
npm i pterojs
```

## Setting Up
PteroJS uses separate classes for the client and application sides of the Pterodactyl API. While you can use both classes to receive websocket events and manage applications, it is recommended to only use one.

### Using the client API
```js
const { PteroClient } = require('pterojs');

// Initialising the client
const client = new PteroClient('your.domain.here', 'pterodactyl_api_key', { ws: true });

// Adding servers to listen for
client.addSocksetServer([ 'kgujg66h', 'avipgt6e' ]);

// Listening to events
client.on('statusUpdate', (server, status) => {
    console.log(server);
    console.log(status);
});

// Connecting to Pterodactyl
client.connect();
```

### Using the application API
```js
const { PteroApp } = require('pterojs');

// Initialising the application
const client = new PteroApp('your.domain.here', 'pterodactyl_api_key', { startup:{ fetchServers: true }});

// Accessing information
client.servers.fetch('evuk98yu').then(console.log);

// Connecting to Pterodactyl
client.connect();
```

## Contributing
1. Fork this repo
2. Make a branch from `main`
3. Commit your changes
4. Open a PR here

## Maintainers
* [Devonte](https://github.com/devnote-dev) - Owner

This repository is managed under the MIT license.

© devnote-dev
