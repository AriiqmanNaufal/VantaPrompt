const config = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/__tests__"],
  transform: {},
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.js"],
  moduleFileExtensions: ["js", "json"]
};

export default config;
