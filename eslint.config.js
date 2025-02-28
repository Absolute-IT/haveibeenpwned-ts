import globals from "globals";
import standard from "eslint-config-love";
import { includeIgnoreFile } from "@eslint/compat";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

export default [
  includeIgnoreFile(gitignorePath),
	{
		...standard,
		files: ["**/*.{js,mjs,cjs,ts}"],
		ignores: [
			"eslint.config.js",
		],
		languageOptions: {
			...standard.languageOptions,
			parserOptions: {
				...standard.languageOptions?.parserOptions,
				extraFileExtensions: [".json", ".md", ".yml", ".yaml"]
			},
			globals: {
				...globals.node,
				...standard.languageOptions?.globals,
			},
		},
		rules: {
			...standard.rules,
			"@typescript-eslint/no-magic-numbers": ["error", { "ignore": [-1, 0, 1, 24, 60, 1000, 3600000, 86400000], ignoreDefaultValues: true, ignoreArrayIndexes: true } ],
			"@typescript-eslint/no-unsafe-member-access": "off",
			"no-magic-numbers": "off", // Must be off for compatibility with ts rules.
			"no-mixed-spaces-and-tabs": "error",
			"no-console": "off",
			"@typescript-eslint/no-console": "off",
			"indent": ["error", "tab", { "MemberExpression": 1, "SwitchCase": 1, "CallExpression": {"arguments": 1} }],
			"prefer-destructuring": "off",
			"@typescript-eslint/prefer-destructuring": "off",
			"complexity": ["error", 6]
		}
	}
];