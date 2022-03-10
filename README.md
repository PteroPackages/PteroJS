<h1 align="center">PteroJS</h1>
<h3 align="center"><strong>A better API wrapper for Pterodactyl</strong></h3>
<p align="center"><img src="https://img.shields.io/badge/discord-invite-5865f2?style=for-the-badge&logo=discord&logoColor=white"> <img src="https://img.shields.io/badge/version-1.2.0-3572A5?style=for-the-badge"> <img src="https://img.shields.io/github/issues/devnote-dev/PteroJS.svg?style=for-the-badge"> <img src="https://img.shields.io/badge/docs-coming_soon-e67e22?style=for-the-badge"></p>

## About
PteroJS is a flexible API wrapper designed to give developers full access over the Pterodactyl API. The library uses a class-based management structure often seen in popular packages like Discord.js which keeps code clean, efficient and practical for any use-case.

## Installing
```
npm install @devnote-dev/pterojs
```
Please join the [support server](https://discord.gg/rmRw4W5XXz) if you experience package installation issues.

## Setting Up
PteroJS uses separate classes for the client and application sides of the Pterodactyl API.

### Using the application API
```js
const { PteroApp } = require('@devnote-dev/pterojs');

// Initialising the application
const client = new PteroApp('your.domain.here', 'pterodactyl_api_key');

// Connecting to Pterodactyl
client.connect();

// Accessing information
client.servers.fetch('evuk98yu').then(console.log);
```

### Using the client API
```js
const { PteroClient } = require('@devnote-dev/pterojs');

// Initialising the client
const client = new PteroClient(
    'your.domain.here',
    'pterodactyl_api_key',
    { ws: true }
);

// Adding servers to listen for
client.addSocksetServer([ 'kgujg66h', 'avipgt6e' ]);

// Listening to events
client.on('statusUpdate', (server, status) => {
    console.log(`${server.name} status: ${status}`);
});

// Connecting to Pterodactyl
client.connect();
```

## Contributing
Please see the [todo list](https://github.com/PteroPackages/PteroJS/blob/main/TODO.md) or [issues](https://github.com/PteroPackages/PteroJS/issues) section for contributing ideas. New ideas are also welcome.

1. [Fork this repo](https://github.com/PteroPackages/pterojs/fork)!
2. Make a branch from `main` (`git branch -b <new-feature>`)
3. Commit your changes (`git commit -am "..."`)
4. Open a PR here (`git push origin <new-feature>`)

## Contributors
* [Devonte](https://github.com/devnote-dev) - Owner, maintainer
* [Zumo](https://github.com/ZumoDev) - Tester
* [Dino](https://github.com/DinoTheDevOfficial) - Tester
* [Cain](https://github.com/cainthebest) - Code contributor

This repository is managed under the MIT license.

© 2021-2022 devnote-dev
