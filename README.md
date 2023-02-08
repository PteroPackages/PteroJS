<h1 align="center">PteroJS</h1>
<h3 align="center"><strong>A verbose API library for Pterodactyl</strong></h3>
<p align="center"><a href="https://discord.com/invite/dwcfTjgn7S" type="_blank"><img src="https://img.shields.io/badge/discord-invite-5865f2?style=for-the-badge&logo=discord&logoColor=white"></a> <img src="https://img.shields.io/badge/version-2.2.0-3572A5?style=for-the-badge"> <img src="https://img.shields.io/github/issues/PteroPackages/PteroJS.svg?style=for-the-badge"> <a href="https://pteropackages.github.io/PteroJS/" type="_blank"><img src="https://img.shields.io/badge/docs-typedoc-e67e22?style=for-the-badge"></a></p>

## About

PteroJS is a verbose API library for the [Pterodactyl Game Panel](https://pterodactyl.io) designed to give developers full access and control over the API without having to compromise on code quality or efficiency.

## Installing

If you are using Node.js (v14.x and above):

```
npm install @devnote-dev/pterojs
yarn add @devnote-dev/pterojs
```

or if you are using Deno:
```js
import pterojs from 'https://cdn.skypack.dev/@devnote-dev/pterojs';
```

Please join the [support server](https://discord.com/invite/dwcfTjgn7S) if you experience any issues with installing the package.

## Compatibility

Note that you can use older versions of PteroJS with newer versions of Pterodactyl and Wings, but they will not be up-to-date with the latest features and fixes.

| PteroJS | Panel            | Wings    |
| ------- | ---------------- | -------- |
| ❌      | `<= 0.7`         | `<= 1.5` |
| `1.3.0` | `1.6.5 >= 1.7.0` | `~1.6.0` |
| `1.4.2` | `1.7.0 >= 1.8.1` | `~1.6.0` |
| `2.0.1` | `^1.9.0`         | `^1.7.0` |
| `2.1.0` | `^1.10.0`        | `^1.7.0` |

## Setting Up

PteroJS uses separate classes for the client and application sides of the Pterodactyl API.

### Using the application API

```js
const { PteroApp } = require('@devnote-dev/pterojs');

// Initialising the application
const app = new PteroApp('your.domain.name', 'pterodactyl_api_key');

// Accessing information
app.servers.fetch(4).then(console.log);
```

### Using the client API

```js
const { PteroClient } = require('@devnote-dev/pterojs');

// Initialising the client
const client = new PteroClient('your.domain.name', 'pterodactyl_api_key');

// Adding the server to listen for
const shard = client.addSocketServer('f7eca02e');

// Listening to events
shard.on('statusUpdate', (status) => {
    console.log(`server ${shard.id} status: ${status}`);
});

// Connecting to the server
shard.connect();
```

## Migrations

Checkout the new [migrations guide](./migrations/v2-0-1.md) to PteroJS v2!

## Contributing

Please see the [issues](https://github.com/PteroPackages/PteroJS/issues) section for contributing ideas. New ideas/features are also welcome.

1. [Fork this repo](https://github.com/PteroPackages/PteroJS/fork)!
2. Make a branch from `main` (`git branch -b <new-feature>`)
3. Commit your changes (`git commit -am "..."`)
4. Open a PR here (`git push origin <new-feature>`)

## Contributors

- [Devonte](https://github.com/devnote-dev) - Owner, maintainer
- [Chelog](https://github.com/chelog) - Code contributor
- [Cain](https://github.com/cainthebest) - Code contributor

This repository is managed under the MIT license.

© 2021-present PteroPackages
