import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut as firebaseSignOut,
} from "firebase/auth";
import { ADMIN_EMAILS } from "../config.js";
import { auth } from "../lib/firebase.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		return onAuthStateChanged(
			auth,
			(nextUser) => {
				setUser(nextUser);
				setLoading(false);
			},
			(error) => {
				console.error("No se pudo observar el estado de autenticación.", error);
				setLoading(false);
			},
		);
	}, []);

	const value = useMemo(() => {
		const isAdmin = !!(
			user?.email &&
			ADMIN_EMAILS.includes(user.email.toLowerCase()) &&
			user.emailVerified
		);
		return {
			user,
			uid: user?.uid ?? null,
			isAdmin,
			loading,
			signIn: (email, password) => signInWithEmailAndPassword(auth, email, password),
			signUp: async (email, password) => {
				const result = await createUserWithEmailAndPassword(auth, email, password);
				await sendEmailVerification(result.user);
				return result;
			},
			resetPassword: (email) => sendPasswordResetEmail(auth, email),
			signOut: () => firebaseSignOut(auth),
		};
	}, [loading, user]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider.");
	return context;
}
