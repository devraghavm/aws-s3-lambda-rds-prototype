module.exports = {
  moduleNameMapper: {
    "^/opt/nodejs/(.*)": "<rootDir>/src/layers/service-layer/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
};
