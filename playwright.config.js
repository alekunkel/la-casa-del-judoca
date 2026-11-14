import { defineConfig, devices } from "@playwright/test";

const emulatorEnvironment = {
	VITE_FIREBASE_API_KEY: "local-emulator-key",
	VITE_FIREBASE_AUTH_DOMAIN: "localhost",
	VITE_FIREBASE_PROJECT_ID: "casa-del-judoca-dev",
	VITE_FIREBASE_STORAGE_BUCKET: "casa-del-judoca-dev.appspot.com",
	VITE_FIREBASE_MESSAGING_SENDER_ID: "123456789",
	VITE_FIREBASE_APP_ID: "1:123456789:web:emulator",
};

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	retries: 0,
	reporter: "list",
	use: {
		baseURL: "http://127.0.0.1:4173",
		trace: "retain-on-failure",
		...devices["Desktop Chrome"],
	},
	webServer: [
		{
			command:
				"firebase emulators:start --config firebase.dev.json --only auth,firestore --project casa-del-judoca-dev",
			port: 9099,
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
		},
		{
			command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
			url: "http://127.0.0.1:4173",
			reuseExistingServer: !process.env.CI,
			timeout: 120000,
			env: emulatorEnvironment,
		},
	],
});
