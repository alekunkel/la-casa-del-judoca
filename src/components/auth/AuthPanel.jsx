import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getAuthErrorMessage } from "../../utils/authMessages.js";

export default function AuthPanel({ open, onAnnouncement }) {
	const { user, loading, signIn, signUp, resetPassword, signOut } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [busy, setBusy] = useState(false);
	const emailRef = useRef(null);
	const signOutRef = useRef(null);

	useEffect(() => {
		if (!open) return;
		(user ? signOutRef.current : emailRef.current)?.focus();
	}, [open, user]);

	const runAction = async (action) => {
		setBusy(true);
		setMessage("");
		try {
			await action();
		} catch (error) {
			setMessage(getAuthErrorMessage(error));
		} finally {
			setBusy(false);
		}
	};

	const handleSignIn = () =>
		runAction(async () => {
			if (!email.trim() || !password) {
				setMessage("Escribí tu correo y tu contraseña.");
				return;
			}
			await signIn(email.trim(), password);
			setPassword("");
			setMessage("");
			onAnnouncement("Ingresaste correctamente.");
		});

	const handleSignUp = () =>
		runAction(async () => {
			if (!email.trim() || !password) {
				setMessage("Escribí tu correo y una contraseña.");
				return;
			}
			const result = await signUp(email.trim(), password);
			setPassword("");
			onAnnouncement(
				result.verificationSent
					? "Cuenta creada. Te mandamos un correo para confirmar tu dirección."
					: "La cuenta se creó, pero no se pudo enviar el correo de confirmación. Probá de nuevo más tarde.",
			);
		});

	const handleReset = () =>
		runAction(async () => {
			if (!email.trim()) {
				setMessage("Escribí tu correo y volvé a tocar este botón.");
				return;
			}
			await resetPassword(email.trim());
			setMessage("Si el correo tiene una cuenta, te mandamos un enlace para cambiar la contraseña.");
		});

	const handleSignOut = () =>
		runAction(async () => {
			await signOut();
			onAnnouncement("Saliste de tu cuenta.");
			setMessage("");
		});

	return (
		<div id="auth" className="ap" role="region" aria-label="Ingresar o crear cuenta" hidden={!open}>
			<p>
				<b>Ingresá o creá tu cuenta para publicar, opinar o dejar una búsqueda.</b>
			</p>
			{user ? (
				<div>
					<p>
						Ingresaste como {user.email}
						{user.emailVerified ? "" : ". Todavía falta confirmar tu correo: revisá tu bandeja de entrada."}
					</p>
					<button ref={signOutRef} className="btn" type="button" disabled={busy} onClick={handleSignOut}>
						Salir
					</button>
				</div>
			) : (
				<div>
					<label htmlFor="auth-email">Correo electrónico</label>
					<input
						ref={emailRef}
						id="auth-email"
						type="email"
						autoComplete="email"
						maxLength="120"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						disabled={loading || busy}
					/>
					<label htmlFor="auth-password">Contraseña (mínimo 6 caracteres)</label>
					<input
						id="auth-password"
						type="password"
						autoComplete="current-password"
						maxLength="100"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						disabled={loading || busy}
					/>
					<div className="acts" style={{ margin: "10px 0" }}>
						<button className="btn" type="button" disabled={loading || busy} onClick={handleSignIn}>
							Ingresar
						</button>
						<button className="btn" type="button" disabled={loading || busy} onClick={handleSignUp}>
							Crear cuenta
						</button>
					</div>
					<button className="x" type="button" disabled={loading || busy} onClick={handleReset}>
						Olvidé mi contraseña
					</button>
				</div>
			)}
			<p role="status" aria-live="polite">
				{message}
			</p>
		</div>
	);
}
