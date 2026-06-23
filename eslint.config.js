import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  {
    ignores: ["dist/", "coverage/", "node_modules/"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  // Clean Architecture layer enforcement: dependencies may only point inward.
  {
    files: ["src/**/*.ts"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "domain", pattern: "src/domain/**" },
        { type: "application", pattern: "src/application/**" },
        { type: "infrastructure", pattern: "src/infrastructure/**" },
        { type: "config", pattern: "src/config/**" },
        { type: "root", pattern: "src/*.ts", mode: "file" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            { from: ["domain"], allow: ["domain"] },
            { from: ["application"], allow: ["domain", "application"] },
            {
              from: ["infrastructure"],
              allow: ["domain", "application", "infrastructure"],
            },
            {
              from: ["config"],
              allow: ["domain", "application", "infrastructure", "config"],
            },
            {
              from: ["root"],
              allow: [
                "domain",
                "application",
                "infrastructure",
                "config",
                "root",
              ],
            },
          ],
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        { allowExpressions: true },
      ],
    },
  },
  {
    files: ["test/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  prettier,
);
