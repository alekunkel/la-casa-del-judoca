import {
	createUserWithEmailAndPassword,
	onAuthStateChanged,
	sendEmailVerification,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signOut,
} from "firebase/auth";
import {
	collection,
	deleteDoc,
	doc,
	onSnapshot,
	orderBy,
	query,
	setDoc,
	updateDoc,
} from "firebase/firestore";
import { ADMIN_EMAILS } from "./config.js";
import { auth, db as firestore } from "./lib/firebase.js";
import { getAuthErrorMessage } from "./utils/authMessages.js";

let servicesPromise;

function showConfigurationError(message) {
	const warning = document.getElementById("cfgwarn");
	if (warning) {
		warning.textContent = message;
		warning.hidden = false;
	}
}

export function initializeFirebase() {
	if (servicesPromise) return servicesPromise;

	servicesPromise = new Promise((resolve, reject) => {
		let currentUser = null;
		let hasAuthState = false;
		let globalMessage = "";
		const authListeners = new Set();
		const getElement = (id) => document.getElementById(id);
		const setAuthStatus = (message) => {
			const status = getElement("ast");
			if (status) status.textContent = message;
		};
		const setGlobalStatus = (message) => {
			globalMessage = message;
			const status = getElement("ok");
			if (status) status.textContent = message;
		};
		const firestoreServices = {
			doc: (path) => ({
				set: (data) => setDoc(doc(firestore, path), data),
				update: (data) => updateDoc(doc(firestore, path), data),
				delete: () => deleteDoc(doc(firestore, path)),
			}),
			collection: (name) => ({
				orderBy: (field, direction) => ({
					onSnapshot: (onNext, onError) =>
						onSnapshot(query(collection(firestore, name), orderBy(field, direction)), (snapshot) =>
							onNext({ docs: snapshot.docs.map((item) => ({ id: item.id, data: () => item.data() })) }),
						onError),
				}),
				onSnapshot: (onNext, onError) =>
					onSnapshot(collection(firestore, name), (snapshot) =>
						onNext({ docs: snapshot.docs.map((item) => ({ id: item.id, data: () => item.data() })) }),
					onError),
			}),
		};
		const user = {
			id: async () => currentUser?.uid ?? null,
			canEdit: () =>
				!!(
					currentUser?.email &&
					ADMIN_EMAILS.includes(currentUser.email.toLowerCase()) &&
					currentUser.emailVerified
				),
			isOwner: () => user.canEdit(),
			subscribe: (listener) => {
				authListeners.add(listener);
				if (hasAuthState) listener(currentUser);
				return () => authListeners.delete(listener);
			},
		};
		const assets = {
			upload: (blob) =>
				new Promise((resolveUpload, rejectUpload) => {
					const reader = new FileReader();
					reader.onload = () => {
						const dataUrl = String(reader.result);
						if (dataUrl.length > 230000) {
							rejectUpload(new Error("foto muy pesada"));
						} else {
							resolveUpload({ id: dataUrl });
						}
					};
					reader.onerror = () => rejectUpload(reader.error ?? new Error("No se pudo leer la foto."));
					reader.readAsDataURL(blob);
				}),
		};
		const services = { db: firestoreServices, user, assets };

		const updateAuthPanel = (nextUser) => {
			currentUser = nextUser;
			const accountButton = getElement("ub");
			const loginPanel = getElement("ain");
			const logoutPanel = getElement("aout");
			const accountMessage = getElement("aem");
			if (logoutPanel) logoutPanel.hidden = !nextUser;
			if (loginPanel) loginPanel.hidden = !!nextUser;
			if (accountButton) accountButton.textContent = nextUser ? "Mi cuenta" : "Ingresar";
			if (accountMessage && nextUser) {
				accountMessage.textContent =
					"Ingresaste como " +
					nextUser.email +
					(nextUser.emailVerified
						? ""
						: ". Todavía falta confirmar tu correo: revisá tu bandeja de entrada.");
			}
			authListeners.forEach((listener) => listener(nextUser));
			if (globalMessage) {
				const status = getElement("ok");
				if (status) status.textContent = globalMessage;
				globalMessage = "";
			}
		};
		const showAuthError = (error) => {
			setAuthStatus(getAuthErrorMessage(error));
		};

		getElement("ub")?.addEventListener("click", () => {
			const panel = getElement("auth");
			const button = getElement("ub");
			if (!panel || !button) return;
			panel.hidden = !panel.hidden;
			button.setAttribute("aria-expanded", String(!panel.hidden));
			if (!panel.hidden) (currentUser ? getElement("alo") : getElement("ae"))?.focus();
		});
		getElement("ali")?.addEventListener("click", async () => {
			const email = getElement("ae")?.value.trim() ?? "";
			const password = getElement("apw")?.value ?? "";
			if (!email || !password) {
				setAuthStatus("Escribí tu correo y tu contraseña.");
				return;
			}
			setAuthStatus("Ingresando…");
			try {
				const result = await signInWithEmailAndPassword(auth, email, password);
				updateAuthPanel(result.user);
				setGlobalStatus("Ingresaste correctamente.");
				setAuthStatus("");
			} catch (error) {
				showAuthError(error);
			}
		});
		getElement("arg")?.addEventListener("click", async () => {
			const email = getElement("ae")?.value.trim() ?? "";
			const password = getElement("apw")?.value ?? "";
			if (!email || !password) {
				setAuthStatus("Escribí tu correo y una contraseña.");
				return;
			}
			setAuthStatus("Creando cuenta…");
			try {
				const result = await createUserWithEmailAndPassword(auth, email, password);
				updateAuthPanel(result.user);
				try {
					await sendEmailVerification(result.user);
					setGlobalStatus("Cuenta creada. Te mandamos un correo para confirmar tu dirección.");
				} catch {
					setGlobalStatus("La cuenta se creó, pero no se pudo enviar el correo de confirmación. Probá de nuevo más tarde.");
				}
				setAuthStatus("");
			} catch (error) {
				showAuthError(error);
			}
		});
		getElement("afp")?.addEventListener("click", async () => {
			const email = getElement("ae")?.value.trim() ?? "";
			if (!email) {
				setAuthStatus("Escribí tu correo y volvé a tocar este botón.");
				return;
			}
			try {
				await sendPasswordResetEmail(auth, email);
				setAuthStatus("Si el correo tiene una cuenta, te mandamos un enlace para cambiar la contraseña.");
			} catch (error) {
				showAuthError(error);
			}
		});
		getElement("alo")?.addEventListener("click", async () => {
			try {
				await signOut(auth);
				setGlobalStatus("Saliste de tu cuenta.");
				setAuthStatus("");
			} catch (error) {
				showAuthError(error);
			}
		});

		onAuthStateChanged(
			auth,
			(nextUser) => {
				hasAuthState = true;
				updateAuthPanel(nextUser);
				resolve(services);
			},
			(error) => {
				showConfigurationError("No se pudo conectar con Firebase. Revisá tu conexión y probá de nuevo.");
				reject(error);
			},
		);
	});

	return servicesPromise;
}
