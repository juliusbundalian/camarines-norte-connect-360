module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  clearMocks: true,
  watchman: false,
  // Jest uses CommonJS while Metro selects Lucide's native ESM entry.
  moduleNameMapper: {
    "^supercluster$": "<rootDir>/node_modules/supercluster/dist/supercluster.js",
    "^lucide-react-native/icons/(.*)$":
      "<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js",
  },
};
