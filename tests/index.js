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
    if (Boolean(ops) !== true) throw new AssertionError();
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

(async () => {
    console.log('Running all tests...\n');
    const { readdirSync } = require('fs');
    let count = 0;
    for (const mod of readdirSync(__dirname)) {
        if (!mod.endsWith('.test.js')) continue;
        console.log(`Running Test #${count++}\n`+ '='.repeat(20));
        await require(`${__dirname}/${mod}`)();
    }
    console.log('Completed all tests.');
})();
