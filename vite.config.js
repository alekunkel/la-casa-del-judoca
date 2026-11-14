import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			output: {
				manualChunks(id) {
					const modulePath = id.replace(/\\/g, "/");
					if (modulePath.includes("/node_modules/@firebase/firestore/"))
						return "firebase-firestore";
					if (modulePath.includes("/node_modules/@firebase/auth/"))
						return "firebase-auth";
					if (modulePath.includes("/node_modules/@firebase/app/"))
						return "firebase-app";
					if (modulePath.includes("/node_modules/@firebase/"))
						return "firebase-shared";
					if (/\/node_modules\/(react|react-dom|scheduler)\//.test(modulePath))
						return "react-vendor";
					return undefined;
				},
			},
		},
	},
	test: {
		environment: "jsdom",
		include: ["tests/unit/**/*.test.{js,jsx}"],
		setupFiles: ["tests/unit/setup.js"],
		restoreMocks: true,
	},
});
