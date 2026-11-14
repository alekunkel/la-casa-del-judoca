import js from "@eslint/js";
import react from "eslint-plugin-react";
import hooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
	{
		ignores: ["dist/**", "node_modules/**"],
	},
	js.configs.recommended,
	{
		files: ["**/*.{js,jsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			parserOptions: { ecmaFeatures: { jsx: true } },
			globals: {
				window: "readonly",
				document: "readonly",
				localStorage: "readonly",
				sessionStorage: "readonly",
				FileReader: "readonly",
				createImageBitmap: "readonly",
				Image: "readonly",
				Blob: "readonly",
				File: "readonly",
				FormData: "readonly",
				URL: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				confirm: "readonly",
				alert: "readonly",
				navigator: "readonly",
				location: "readonly",
				console: "readonly",
				process: "readonly",
				queueMicrotask: "readonly",
			},
		},
		settings: { react: { version: "detect" } },
		plugins: {
			react,
			"react-hooks": hooks,
			"jsx-a11y": jsxA11y,
		},
		rules: {
			...react.configs.recommended.rules,
			...hooks.configs.recommended.rules,
			...jsxA11y.flatConfigs.recommended.rules,
			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off",
		},
	},
];
