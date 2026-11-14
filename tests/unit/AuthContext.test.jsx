import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "../../src/context/AuthContext.jsx";

const authMocks = vi.hoisted(() => ({
	onAuthStateChanged: vi.fn(),
	signInWithEmailAndPassword: vi.fn(),
	createUserWithEmailAndPassword: vi.fn(),
	sendEmailVerification: vi.fn(),
	sendPasswordResetEmail: vi.fn(),
	signOut: vi.fn(),
}));

vi.mock("firebase/auth", () => authMocks);
vi.mock("../../src/lib/firebase.js", () => ({ auth: {} }));

describe("AuthContext", () => {
	beforeEach(() => {
		authMocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
			onUser({
				uid: "admin",
				email: "davidjudo.23@gmail.com",
				emailVerified: false,
				getIdTokenResult: vi.fn().mockResolvedValue({ claims: { admin: true } }),
			});
			return vi.fn();
		});
	});

	it("solo considera administrador a una cuenta con claim admin", async () => {
		const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.isAdmin).toBe(true);
	});

	it("rechaza usuarios con correo administrador pero sin claim", async () => {
		authMocks.onAuthStateChanged.mockImplementation((_auth, onUser) => {
			onUser({
				uid: "admin-like",
				email: "davidjudo.23@gmail.com",
				emailVerified: true,
				getIdTokenResult: vi.fn().mockResolvedValue({ claims: {} }),
			});
			return vi.fn();
		});
		const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
		const { result } = renderHook(() => useAuth(), { wrapper });
		await waitFor(() => expect(result.current.loading).toBe(false));
		expect(result.current.isAdmin).toBe(false);
	});

	it("expone la acción de inicio de sesión", async () => {
		authMocks.signInWithEmailAndPassword.mockResolvedValue({
			user: { uid: "buyer" },
		});
		const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;
		const { result } = renderHook(() => useAuth(), { wrapper });
		await act(async () =>
			result.current.signIn("buyer@example.com", "password"),
		);
		expect(authMocks.signInWithEmailAndPassword).toHaveBeenCalledOnce();
	});
});
