class AssertionError extends Error {
    constructor() { super('Assertion failed') }
}

function logTest(test) {
    console.log(
        '-'.repeat(15 + test.baseReturn.length) +'\n'+
        `Running Test\nName        : ${test.name}\n`+
        `Description : ${test.description}\n`+
        `Return      : ${test.baseReturn}\n`+
        '-'.repeat(15 + test.baseReturn.length)
    );
}

function assert(ops) {
    console.log(ops);
    if (ops !== true) throw new AssertionError();
}

function test(name, exec, returnValue = null) {
    this.meta = {
        name,
        description: null,
        group: null,
        baseReturn: (returnValue && typeof returnValue) || 'null'
    }

    logTest(this.meta);
    if (returnValue !== undefined) {
        assert(exec() === returnValue);
    } else {
        assert(exec());
    }
}

module.exports = { test, assert };

(() => {
    if (process.argv[0] === 'all') {
        console.log('Running all tests...\n');

        const { readdirSync } = require('fs');
        readdirSync(__dirname)
        .filter(f => f.endsWith('.test.js'))
        .forEach(m => require(`${__dirname}/${m}`)());
    }
})();
