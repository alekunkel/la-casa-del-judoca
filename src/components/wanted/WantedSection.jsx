import { useEffect, useRef, useState } from "react";
import { createWanted, deleteWanted, setWantedStatus } from "../../services/wanted.js";

function makeWantedId() {
	return `w${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function WantedForm({ uid, isAdmin, onLoginRequest, onAnnouncement }) {
	const [open, setOpen] = useState(false);
	const [status, setStatus] = useState("");
	const [busy, setBusy] = useState(false);
	const whatRef = useRef(null);

	useEffect(() => {
		if (open) whatRef.current?.focus();
	}, [open]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!uid) {
			setStatus("Primero ingresá o creá tu cuenta (botón Ingresar, arriba).");
			onLoginRequest();
			return;
		}
		const form = event.currentTarget;
		const formData = new FormData(form);
		const whatsapp = String(formData.get("whatsapp") || "");
		const normalizedWhatsApp = whatsapp.replace(/\D/g, "");
		if (normalizedWhatsApp.length < 10 || normalizedWhatsApp.length > 15) {
			setStatus("Revisá el WhatsApp: usá solo números con código de país.");
			return;
		}
		setBusy(true);
		setStatus("Publicando…");
		try {
			const id = makeWantedId();
			await createWanted(id, {
				text: String(formData.get("text")).trim(),
				name: String(formData.get("name")).trim(),
				city: String(formData.get("city") || "").trim(),
				wa: whatsapp.trim(),
				owner: uid,
				ts: Date.now(),
				status: isAdmin ? "approved" : "pending",
			});
			form.reset();
			setOpen(false);
			setStatus("");
			onAnnouncement(
				isAdmin
					? "Búsqueda publicada."
					: "¡Listo! Tu búsqueda aparece cuando la revisemos.",
			);
		} catch (error) {
			console.error("No se pudo publicar la búsqueda.", error);
			setStatus("No se pudo publicar. Probá de nuevo.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<button
				type="button"
				className="btn"
				aria-expanded={open}
				aria-controls="wanted-form"
				onClick={() => setOpen((current) => !current)}
			>
				Publicar lo que busco
			</button>
			<form
				id="wanted-form"
				className={open ? "on" : ""}
				style={{ marginTop: 12 }}
				hidden={!open}
				onSubmit={handleSubmit}
			>
				<div className="f">
					<label htmlFor="wanted-text">¿Qué buscás?</label>
					<input
						ref={whatRef}
						id="wanted-text"
						name="text"
						required
						maxLength="100"
						placeholder="Ej: Judogi blanco talle 4"
					/>
				</div>
				<div>
					<label htmlFor="wanted-name">Tu nombre</label>
					<input id="wanted-name" name="name" required maxLength="40" />
				</div>
				<div>
					<label htmlFor="wanted-city">Ciudad o zona</label>
					<input id="wanted-city" name="city" maxLength="40" />
				</div>
				<div className="f">
					<label htmlFor="wanted-whatsapp">WhatsApp (con código de país)</label>
					<input
						id="wanted-whatsapp"
						name="whatsapp"
						required
						maxLength="20"
						inputMode="tel"
						placeholder="5491122334455"
					/>
				</div>
				<div className="f">
					<button className="btn" type="submit" disabled={busy}>
						Publicar
					</button>
					<span className="m" role="status" aria-live="polite">
						{status}
					</span>
				</div>
			</form>
		</>
	);
}

export default function WantedSection({
	items,
	loading,
	error,
	uid,
	isAdmin,
	onLoginRequest,
	onAnnouncement,
}) {
	const [message, setMessage] = useState("");
	const visibleItems = items.filter(
		(item) => item.status === "approved" || isAdmin || (!!uid && item.owner === uid),
	);

	const handleDelete = async (item) => {
		if (!window.confirm("¿Eliminar esta búsqueda?")) return;
		try {
			await deleteWanted(item.id);
			onAnnouncement("Búsqueda eliminada.");
		} catch (deleteError) {
			console.error("No se pudo eliminar la búsqueda.", deleteError);
			setMessage("No se pudo eliminar.");
		}
	};

	const handleApproval = async (item) => {
		if (!isAdmin) return;
		await setWantedStatus(item.id, item.status === "approved" ? "pending" : "approved");
		onAnnouncement(
			item.status === "approved" ? "Búsqueda ocultada." : "Búsqueda aprobada.",
		);
	};

	return (
		<section className="info" aria-labelledby="wanted-heading">
			<h2 id="wanted-heading">Se busca</h2>
			<p>
				¿Necesitás algo y no lo encontrás? Publicá lo que buscás y los
				vendedores te escriben.
			</p>
			<WantedForm
				uid={uid}
				isAdmin={isAdmin}
				onLoginRequest={onLoginRequest}
				onAnnouncement={onAnnouncement}
			/>
			<p className="m" role="status" aria-live="polite">
				{error
					? "No se pudieron cargar las búsquedas."
					: loading
						? "Cargando búsquedas…"
						: visibleItems.length
							? ""
							: "Todavía no hay búsquedas."}
			</p>
			<p className="m" role="status" aria-live="polite">
				{message}
			</p>
			<div id="wl">
				{visibleItems.map((item) => (
					<article key={item.id} className="card">
						<div className="b">
							<div className="pr">Busco: {item.text}</div>
							<div className="m">
								{item.name}
								{item.city ? ` · ${item.city}` : ""}
							</div>
							{item.status !== "approved" && <div className="m">En revisión</div>}
							<a
								className="btn"
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Escribirle por WhatsApp a ${item.name} (se abre en otra pestaña)`}
								href={`https://wa.me/${String(item.wa || "").replace(/\D/g, "")}?text=${encodeURIComponent(
									`Hola! Vi tu búsqueda en La Casa del Judoka: ${item.text}`,
								)}`}
							>
								Escribirle por WhatsApp
							</a>
							{(isAdmin || (!!uid && item.owner === uid)) && (
								<div className="acts">
									{isAdmin && (
										<button
											className="x"
											type="button"
											onClick={() => handleApproval(item)}
										>
											{item.status === "approved" ? "Ocultar búsqueda" : "Aprobar búsqueda"}
										</button>
									)}
									<button
										className="x"
										type="button"
										onClick={() => handleDelete(item)}
									>
										Eliminar búsqueda
										<span className="sr-only">: {item.text}</span>
									</button>
								</div>
							)}
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
