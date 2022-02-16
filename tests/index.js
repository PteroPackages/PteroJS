(async () => {
    console.log('Running all tests...');
    const { readdirSync } = require('fs');
    let count = 0;

    for (const mod of readdirSync(__dirname)) {
        if (!mod.endsWith('.test.js')) continue;

        console.log(`\nRunning Test #${count++}\n`+ '='.repeat(20));
        require(`${__dirname}/${mod}`);
    }
    console.log('Completed all tests.');
})();
