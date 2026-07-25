export default {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@gurokonekt/models$': '<rootDir>/../../lib/models/src/index.ts',
    '^@gurokonekt/models/(.*)$': '<rootDir>/../../lib/models/src/lib/$1',
  },
  coverageDirectory: '../../coverage/apps/api',
};
