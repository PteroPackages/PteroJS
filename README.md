<h1 align="center">PteroJS</h1>
<h3 align="center"><strong>A verbose API library for Pterodactyl</strong></h3>
<p align="center"><a href="https://discord.com/invite/dwcfTjgn7S" type="_blank"><img src="https://img.shields.io/badge/discord-invite-5865f2?style=for-the-badge&logo=discord&logoColor=white"></a> <img src="https://img.shields.io/badge/version-2.0.1-3572A5?style=for-the-badge"> <img src="https://img.shields.io/github/issues/PteroPackages/PteroJS.svg?style=for-the-badge"> <a href="https://pteropackages.github.io/PteroJS/" type="_blank"><img src="https://img.shields.io/badge/docs-typedoc-e67e22?style=for-the-badge"></a></p>

## About
PteroJS is a verbose API library for the [Pterodactyl Game Panel](https://pterodactyl.io) designed to give developers full access and control over the API without having to compromise on code quality or efficiency.

## Installing
If you are using Node.js (v14.x and above):
```
npm install @devnote-dev/pterojs
yarn add @devnote-dev/pterojs
```
<!-- Deno isn't fully supported yet.

or if you are using Deno:
```js
import pterojs from 'https://cdn.skypack.dev/@devnote-dev/pterojs';
```
-->
Please join the [support server](https://discord.com/invite/dwcfTjgn7S) if you experience any issues with installing the package.

## Compatibility
Pterodactyl API | Wings API | Support
----------------|-----------|--------
`<=0.7` | `<=1.5` | ❌
`^1.6.5` | `^1.6` | ✅

## Setting Up
PteroJS uses separate classes for the client and application sides of the Pterodactyl API.

### Using the application API
```js
const { PteroApp } = require('@devnote-dev/pterojs');

// Initialising the application
const client = new PteroApp('your.domain.name', 'pterodactyl_api_key');

// Accessing information
client.servers.fetch('evuk98yu').then(console.log);
```

### Using the client API
```js
const { PteroClient } = require('@devnote-dev/pterojs');

// Initialising the client
const client = new PteroClient(
    'your.domain.name',
    'pterodactyl_api_key',
    { ws: true }
);

// Adding the server to listen for
const shard = client.addSocksetServer('kgujg66h');

// Listening to events
shard.on('statusUpdate', status => {
    console.log(`server ${shard.id} status: ${status}`);
});

// Connecting to the server
shard.connect();
```

## Contributing
Please see the [todo list](https://github.com/PteroPackages/PteroJS/blob/main/TODO.md) or [issues](https://github.com/PteroPackages/PteroJS/issues) section for contributing ideas. New ideas/features are also welcome.

1. [Fork this repo](https://github.com/PteroPackages/PteroJS/fork)!
2. Make a branch from `main` (`git branch -b <new-feature>`)
3. Commit your changes (`git commit -am "..."`)
4. Open a PR here (`git push origin <new-feature>`)

## Contributors
* [Devonte](https://github.com/devnote-dev) - Owner, maintainer
* [Chelog](https://github.com/chelog) - Code contributor
* [Cain](https://github.com/cainthebest) - Code contributor

This repository is managed under the MIT license.

© 2021-2022 PteroPackages
