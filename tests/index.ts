import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { PteroApp, PteroClient } from '../src';

type AppTest = (ctrl: PteroApp) => void;
type ClientTest = (ctrl: PteroClient) => void;

const args = process.argv.slice(1);
if (!args.length) throw new Error(
    "Test must specify 'app', 'client' or 'all'."
);

if (!args.some(a => ['app', 'client', 'all'].includes(a))) throw new Error(
    "Invalid test argument; must be 'app', 'client', or 'all'."
);

if (!existsSync(join(__dirname, 'auth.json')))
    throw new Error('Authentication file is required for tests.');

import * as auth from './auth.json';

if (args.includes('app') || args.includes('all')) {
    const app = new PteroApp(auth.app.url, auth.app.key);

    readdirSync(join(__dirname, 'application'))
    .forEach(async file => {
        const { test } = await import(`./application/${file}`);
        (<AppTest> test)(app);
    });
}

if (args.includes('client') || args.includes('all')) {
    const client = new PteroClient(auth.client.url, auth.client.key);

    readdirSync(join(__dirname, 'client'))
    .forEach(async file => {
        const { test } = await import(`./client/${file}`);
        (<ClientTest> test)(client);
    });
}
