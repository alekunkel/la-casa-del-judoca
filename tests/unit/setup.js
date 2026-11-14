import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

vi.mock("../../src/lib/firebase.js", () => ({
	app: {},
	auth: {},
	db: {},
}));
afterEach(() => {
	cleanup();
	localStorage.clear();
	vi.unstubAllGlobals();
});
