import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../lib/firebase.js";
import { getAuthErrorMessage } from "../utils/authMessages.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isAdmin, setIsAdmin] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	useEffect(() => {
		return onAuthStateChanged(
			auth,
			async (nextUser) => {
				setUser(nextUser);
				setErrorMessage("");
				if (!nextUser) {
					setIsAdmin(false);
					setLoading(false);
					return;
				}
				try {
					const tokenResult = await nextUser.getIdTokenResult();
					setIsAdmin(tokenResult.claims.admin === true);
				} catch (error) {
					console.error("No se pudo resolver el token de autenticación.", error);
					setIsAdmin(false);
				} finally {
					setLoading(false);
				}
			},
			(error) => {
				console.error("No se pudo observar el estado de autenticación.", error);
				setErrorMessage(getAuthErrorMessage(error));
				setLoading(false);
			},
		);
	}, []);

	const value = useMemo(() => {
		return {
			user,
			uid: user?.uid ?? null,
			isAdmin,
			loading,
			errorMessage,
			signIn: (email, password) =>
				signInWithEmailAndPassword(auth, email, password),
			signUp: async (email, password) => {
				const result = await createUserWithEmailAndPassword(
					auth,
					email,
					password,
				);
				try {
					await sendEmailVerification(result.user);
					return { user: result.user, verificationSent: true };
				} catch (error) {
					return {
						user: result.user,
						verificationSent: false,
						verificationError: error,
					};
				}
			},
			resetPassword: (email) => sendPasswordResetEmail(auth, email),
			signOut: () => firebaseSignOut(auth),
		};
	}, [errorMessage, isAdmin, loading, user]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
	return context;
}
