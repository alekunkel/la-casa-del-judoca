const authMessages = {
	"auth/invalid-email": "El correo no es válido.",
	"auth/email-already-in-use":
		"Ese correo ya tiene una cuenta. Probá con Ingresar.",
	"auth/weak-password":
		"La contraseña es muy corta. Usá al menos 6 caracteres.",
	"auth/invalid-credential": "Correo o contraseña incorrectos.",
	"auth/user-not-found": "Correo o contraseña incorrectos.",
	"auth/wrong-password": "Correo o contraseña incorrectos.",
	"auth/missing-password": "Escribí tu contraseña.",
	"auth/too-many-requests": "Demasiados intentos. Esperá unos minutos.",
};

export function getAuthErrorMessage(error) {
	return authMessages[error?.code] ?? "No se pudo. Probá de nuevo.";
}
