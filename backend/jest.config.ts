import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',

  moduleFileExtensions: ['js', 'json', 'ts'],

  extensionsToTreatAsEsm: ['.ts'],

  rootDir: '.',

  testRegex: '.*\\.spec\\.ts$',

  moduleNameMapper: {
    // Resolve NodeNext-style relative .js specifiers to their TypeScript source.
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },

  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],

  coverageDirectory: './coverage',

  testEnvironment: 'node',
};

export default config;
