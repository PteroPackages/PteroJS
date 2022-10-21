import { Config } from 'jest';

export default <Config>{
    globals: {
        'ts-jest': {
            isolatedModules: true,
        },
    },
    preset: 'ts-jest',
    rootDir: 'tests',
    testEnvironment: 'node',
};
