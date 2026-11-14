import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.stubEnv("VITE_FIREBASE_API_KEY", "test-key");
vi.stubEnv("VITE_FIREBASE_AUTH_DOMAIN", "localhost");
vi.stubEnv("VITE_FIREBASE_PROJECT_ID", "casa-del-judoca-dev");
vi.stubEnv("VITE_FIREBASE_STORAGE_BUCKET", "casa-del-judoca-dev.appspot.com");
vi.stubEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", "123456789");
vi.stubEnv("VITE_FIREBASE_APP_ID", "1:123456789:web:test");
afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.unstubAllGlobals();
});
