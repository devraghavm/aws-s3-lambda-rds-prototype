module.exports = {
  moduleNameMapper: {
    '^/opt/nodejs/(.*)': '<rootDir>/src/layers/utils/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
};
