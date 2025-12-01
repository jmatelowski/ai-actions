import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.js",
  output: {
    file: "dist/index.cjs",
    format: "cjs",
  },
  external: ["@actions/core", "@actions/github", "@google/genai"],
  platform: "node",
});
