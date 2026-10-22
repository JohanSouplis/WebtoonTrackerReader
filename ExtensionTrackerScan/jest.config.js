module.exports = {
  projects: [
    {
      displayName: "core",
      preset: "ts-jest",
      testEnvironment: "node",
      testMatch: ["<rootDir>/src/app/core/**/*.spec.ts"],
    },
    {
      displayName: "angular",
      preset: "jest-preset-angular",
      setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
      testMatch: ["<rootDir>/src/app/angular/**/*.spec.ts"],
      transform: {
        "^.+\\.(ts|mjs|js|html)$": [
          "jest-preset-angular",
          {
            tsconfig: "<rootDir>/tsconfig.spec.json",
            stringifyContentPathRegex: "\\.(html|svg)$",
          },
        ],
      },
    },
  ],
};
