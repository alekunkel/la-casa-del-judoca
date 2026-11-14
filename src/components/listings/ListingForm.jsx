import { useEffect, useRef, useState } from "react";
import { createListing } from "../../services/listings.js";
import { fileToDataUrl } from "../../utils/photos.js";
import { shrinkImage } from "../../utils/shrinkImage.js";
import PhotoUploader from "./PhotoUploader.jsx";

const categories = [
	"Judogis",
	"Cinturones",
	"Protecciones",
	"Remeras y buzos",
	"Otros",
];
const conditions = [
	"Nuevo",
	"Como nuevo",
	"Muy buen estado",
	"Buen estado",
	"Con detalles",
];
const paymentOptions = ["Efectivo", "Transferencia", "Mercado Pago"];
const shippingOptions = ["Retiro en persona", "Envío por correo", "A convenir"];

function makeListingId() {
	return `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export default function ListingForm({
	uid,
	isAdmin,
	onLoginRequest,
	onAnnouncement,
}) {
	const [open, setOpen] = useState(false);
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState("");
	const [files, setFiles] = useState([]);
	const [alt, setAlt] = useState("");
	const titleRef = useRef(null);
	const whatsappRef = useRef(null);
	const altRef = useRef(null);
	useEffect(() => {
		if (open) titleRef.current?.focus();
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
			whatsappRef.current?.focus();
			return;
		}
		if (files.length && !alt.trim()) {
			setStatus(
				"Escribí una descripción corta de la foto. Ayuda a quienes usan lector de pantalla.",
			);
			altRef.current?.focus();
			return;
		}

		setBusy(true);
		setStatus("Preparando fotos y publicando…");
		try {
			const photos = [];
			for (const file of files.slice(0, 4)) {
				photos.push(await fileToDataUrl(await shrinkImage(file)));
			}
			const id = makeListingId();
			await createListing(id, {
				title: String(formData.get("title")).trim(),
				seller: String(formData.get("seller")).trim(),
				size: String(formData.get("size")).trim(),
				alt: alt.trim(),
				pay: formData.getAll("payment").map(String),
				ship: formData.getAll("shipping").map(String),
				city: String(formData.get("city") || "").trim(),
				cat: String(formData.get("category")),
				sold: false,
				cond: String(formData.get("condition")),
				price: Number(formData.get("price")),
				wa: whatsapp.trim(),
				photo: null,
				photos,
				owner: uid,
				ts: Date.now(),
				status: isAdmin ? "approved" : "pending",
				featured: false,
			});
			form.reset();
			setFiles([]);
			setAlt("");
			setOpen(false);
			setStatus("");
			onAnnouncement(
				isAdmin
					? "Publicación creada."
					: "¡Listo! Tu publicación aparece cuando la revisemos. Mientras tanto la ves con la etiqueta En revisión.",
			);
		} catch (error) {
			console.error("No se pudo crear la publicación.", error);
			setStatus(
				error instanceof Error && error.message === "foto muy pesada"
					? "La foto es muy pesada. Elegí una más liviana."
					: "No se pudo publicar. Probá de nuevo.",
			);
		} finally {
			setBusy(false);
		}
	};

	return (
		<>
			<div className="bar">
				<button
					className="btn"
					type="button"
					aria-expanded={open}
					aria-controls="listing-form"
					onClick={() => setOpen((current) => !current)}
				>
					Publicar mi producto
				</button>
			</div>
			<form
				id="listing-form"
				className={open ? "on" : ""}
				onSubmit={handleSubmit}
				hidden={!open}
			>
				<div className="f">
					<label htmlFor="listing-seller">Tu nombre</label>
					<input
						id="listing-seller"
						name="seller"
						required
						maxLength="40"
						placeholder="Nombre y apellido o apodo"
					/>
				</div>
				<div className="f">
					<label htmlFor="listing-title">Título</label>
					<input
						ref={titleRef}
						id="listing-title"
						name="title"
						required
						maxLength="60"
						placeholder="Judogi blanco Mizuno"
					/>
				</div>
				<div>
					<label htmlFor="listing-category">Categoría</label>
					<select
						id="listing-category"
						name="category"
						defaultValue={categories[0]}
					>
						{categories.map((category) => (
							<option key={category}>{category}</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="listing-size">Talle</label>
					<input
						id="listing-size"
						name="size"
						required
						maxLength="10"
						placeholder="A3 / 170 cm"
					/>
				</div>
				<div>
					<label htmlFor="listing-condition">Estado</label>
					<select
						id="listing-condition"
						name="condition"
						defaultValue="Muy buen estado"
					>
						{conditions.map((condition) => (
							<option key={condition}>{condition}</option>
						))}
					</select>
				</div>
				<div>
					<label htmlFor="listing-price">Precio ($)</label>
					<input
						id="listing-price"
						name="price"
						type="number"
						min="0"
						required
					/>
				</div>
				<div className="f">
					<label htmlFor="listing-whatsapp">
						WhatsApp (con código de país)
					</label>
					<input
						ref={whatsappRef}
						id="listing-whatsapp"
						name="whatsapp"
						required
						maxLength="20"
						inputMode="tel"
						placeholder="5491122334455"
					/>
				</div>
				<div className="f">
					<span id="listing-payment-label">Formas de pago</span>
					<div
						className="ck"
						role="group"
						aria-labelledby="listing-payment-label"
					>
						{paymentOptions.map((option) => (
							<label key={option}>
								<input type="checkbox" name="payment" value={option} /> {option}
							</label>
						))}
					</div>
				</div>
				<div className="f">
					<span id="listing-shipping-label">Entrega</span>
					<div
						className="ck"
						role="group"
						aria-labelledby="listing-shipping-label"
					>
						{shippingOptions.map((option) => (
							<label key={option}>
								<input type="checkbox" name="shipping" value={option} />{" "}
								{option}
							</label>
						))}
					</div>
				</div>
				<div className="f">
					<label htmlFor="listing-city">Ciudad o zona</label>
					<input
						id="listing-city"
						name="city"
						maxLength="40"
						placeholder="Ej: Rosario, Santa Fe"
					/>
				</div>
				<PhotoUploader
					files={files}
					onChange={setFiles}
					alt={alt}
					onAltChange={setAlt}
					altRef={altRef}
					disabled={busy}
				/>
				<div className="f">
					<button className="btn" type="submit" disabled={busy}>
						{busy ? "Publicando…" : "Publicar"}
					</button>
					<span className="m" role="status" aria-live="polite">
						{status}
					</span>
				</div>
			</form>
		</>
	);
}
