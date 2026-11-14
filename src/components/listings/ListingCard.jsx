import { useState } from "react";
import { CFG } from "../../config.js";
import {
	deleteListing,
	setListingFeatured,
	setListingStatus,
	updateListing,
} from "../../services/listings.js";
import { setSellerVerification } from "../../services/sellers.js";
import { createReport } from "../../services/reports.js";
import { getRatingSummary } from "../reviews/RatingSummary.jsx";
import ReviewPanel from "../reviews/ReviewPanel.jsx";

function makeReportId() {
	return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function TagList({ label, values }) {
	if (!Array.isArray(values) || !values.length) return null;
	return (
		<>
			<div className="m">{label}:</div>
			<div className="tags">
				{values.map((value, index) => (
					<span key={`${value}-${index}`}>{value}</span>
				))}
			</div>
		</>
	);
}

export default function ListingCard({
	listing,
	verified,
	reviews,
	uid,
	isAdmin,
	isFavorite,
	onToggleFavorite,
	onAnnouncement,
}) {
	const [reviewsOpen, setReviewsOpen] = useState(false);
	const [paymentOpen, setPaymentOpen] = useState(false);
	const canManage = isAdmin || (!!uid && listing.owner === uid);
	const photos = listing.photos?.length
		? listing.photos
		: listing.photo
			? [listing.photo]
			: [];
	const whatsapp = String(listing.wa || "").replace(/\D/g, "");
	const rating = getRatingSummary(reviews, listing.owner);
	const paymentEnabled = !!(CFG.precio && (CFG.alias || CFG.link) && CFG.wa);
	const reviewPanelId = `reviews-${listing.id}`;
	const featured = Boolean(listing.featured);
	const approved = listing.status === "approved";

	const runAction = async (action, successMessage, errorMessage) => {
		try {
			await action();
			if (successMessage) onAnnouncement(successMessage);
		} catch (error) {
			console.error(errorMessage, error);
			onAnnouncement(errorMessage);
		}
	};

	const handleShare = async () => {
		const title = `${listing.title} - $${Number(listing.price).toLocaleString("es-AR")} en La Casa del Judoka`;
		try {
			if (navigator.share) {
				await navigator.share({
					title,
					text: title,
					url: window.location.href,
				});
			} else {
				window.open(
					`https://wa.me/?text=${encodeURIComponent(`${title} ${window.location.href}`)}`,
					"_blank",
					"noopener",
				);
			}
		} catch (error) {
			if (error?.name !== "AbortError") {
				console.error("No se pudo compartir la publicación.", error);
				onAnnouncement("No se pudo compartir la publicación.");
			}
		}
	};

	const handleReport = async () => {
		if (
			!window.confirm("¿Querés denunciar esta publicación? La vamos a revisar.")
		)
			return;
		await runAction(
			() =>
				createReport(makeReportId(), {
					listing: listing.id,
					title: listing.title,
					ts: Date.now(),
					by: uid,
				}),
			"Gracias. Vamos a revisar la publicación.",
			"No se pudo enviar la denuncia. Probá de nuevo.",
		);
	};

	const handleDelete = async () => {
		if (!window.confirm("¿Eliminar esta publicación?")) return;
		await runAction(
			() => deleteListing(listing.id),
			"Publicación eliminada.",
			"No se pudo eliminar la publicación.",
		);
	};

	const handleFeatured = () =>
		runAction(
			() => setListingFeatured(listing.id, !featured),
			featured ? "Se quitó el destacado." : "Publicación destacada.",
			"No se pudo actualizar el destacado.",
		);

	const handleApproval = () =>
		runAction(
			() => setListingStatus(listing.id, approved ? "pending" : "approved"),
			approved ? "Publicación ocultada." : "Publicación aprobada.",
			"No se pudo actualizar la aprobación.",
		);

	const handleVerification = () =>
		runAction(
			() =>
				setSellerVerification(listing.owner, !verified, listing.seller || ""),
			verified
				? "Se quitó la verificación del vendedor."
				: "Vendedor verificado.",
			"No se pudo actualizar la verificación.",
		);

	return (
		<article className={`card${listing.sold ? " sold" : ""}${featured ? " feat" : ""}`}>
			<div
				className={`ph${photos.length > 1 ? " g" : ""}`}
				{...(photos.length > 1
					? {
							tabIndex: 0,
							role: "group",
							"aria-label": "Fotos del producto: deslizá para ver más",
						}
					: {})}
			>
				{listing.sold && <span className="badge">Vendido</span>}
				{featured && <span className="badge f">Destacado</span>}
				{!approved && <span className="badge f">En revisión</span>}
				{photos.length ? (
					photos.map((photo, index) => (
						<img
							key={`${listing.id}-${index}`}
							alt={`${listing.alt || `Foto de ${listing.title}`}${
								photos.length > 1
									? ` (foto ${index + 1} de ${photos.length})`
									: ""
							}`}
							loading="lazy"
							src={photo}
						/>
					))
				) : (
					<span>Foto no disponible</span>
				)}
			</div>
			<div className="b">
				<div className="pr">${Number(listing.price).toLocaleString("es-AR")}</div>
				<div>{listing.title}</div>
				<div className="m">Talle {listing.size} · {listing.cond}</div>
				<div className="m">
					Vendedor: {listing.seller || "sin nombre"}
					{rating}
					{verified && (
						<span className="vf">
							<span aria-hidden="true">✔ </span>Vendedor verificado
						</span>
					)}
				</div>
				{listing.city && (
					<div className="m">
						<span aria-hidden="true">📍</span> Zona: {listing.city}
					</div>
				)}
				<TagList label="Pago" values={listing.pay} />
				<TagList label="Entrega" values={listing.ship} />
				{!listing.sold && (
					<a
						className="btn"
						target="_blank"
						rel="noopener noreferrer"
						aria-label={`Consultar por WhatsApp sobre ${listing.title} (se abre en otra pestaña)`}
						href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
							`Hola! Vi tu publicación en La Casa del Judoka: ${listing.title || ""}`,
						)}`}
					>
						Consultar por WhatsApp
					</a>
				)}
				<div className="acts">
					<button
						className="x"
						type="button"
						aria-label={`Compartir: ${listing.title}`}
						onClick={handleShare}
					>
						Compartir
					</button>
					<button
						className="x"
						type="button"
						aria-pressed={isFavorite}
						aria-label={`${isFavorite ? "Quitar de favoritos" : "Guardar en favoritos"}: ${listing.title}`}
						onClick={() => onToggleFavorite(listing.id)}
					>
						{isFavorite ? "♥ Guardado" : "♡ Guardar"}
					</button>
					<button
						className="x"
						type="button"
						aria-label={`Denunciar publicación: ${listing.title}`}
						onClick={handleReport}
					>
						Denunciar
					</button>
					<button
						className="x"
						type="button"
						aria-expanded={reviewsOpen}
						aria-controls={reviewPanelId}
						aria-label={`Ver u opinar sobre el vendedor de ${listing.title}`}
						onClick={() => setReviewsOpen((current) => !current)}
					>
						Opiniones
					</button>
					{canManage && (
						<>
							<button
								className="x"
								type="button"
								aria-label={`${listing.sold ? "Marcar como disponible" : "Marcar como vendido"}: ${listing.title}`}
								onClick={() =>
									runAction(
										() => updateListing(listing.id, { sold: !listing.sold }),
										listing.sold
											? "Publicación disponible."
											: "Publicación marcada como vendida.",
										"No se pudo actualizar la publicación.",
									)
								}
							>
								{listing.sold ? "Marcar como disponible" : "Marcar como vendido"}
							</button>
							<button
								className="x"
								type="button"
								aria-label={`Eliminar publicación: ${listing.title}`}
								onClick={handleDelete}
							>
								Eliminar publicación
							</button>
							{paymentEnabled && uid === listing.owner && !featured && !listing.sold && (
								<button
									className="x"
									type="button"
									aria-expanded={paymentOpen}
									aria-controls={`payment-${listing.id}`}
									aria-label={`Destacar publicación: ${listing.title}`}
									onClick={() => setPaymentOpen((current) => !current)}
								>
									Destacar mi publicación
								</button>
							)}
							{isAdmin && (
								<>
									<button
										className="x"
										type="button"
										aria-label={`${approved ? "Ocultar publicación" : "Aprobar publicación"}: ${listing.title}`}
										onClick={handleApproval}
									>
										{approved ? "Ocultar publicación" : "Aprobar publicación"}
									</button>
									{listing.owner && (
										<button
											className="x"
											type="button"
											aria-label={`${verified ? "Quitar verificado a " : "Verificar a "}${listing.seller || "vendedor"}`}
											onClick={handleVerification}
										>
											{verified ? "Quitar verificado" : "Verificar vendedor"}
										</button>
									)}
									<button className="x" type="button" onClick={handleFeatured}>
										{featured ? "Quitar destacado" : "Activar destacado"}
										<span className="sr-only">: {listing.title}</span>
									</button>
								</>
							)}
						</>
					)}
				</div>
				{paymentOpen && (
					<div
						id={`payment-${listing.id}`}
						className="pay"
						role="region"
						aria-label="Cómo destacar la publicación"
					>
						<p>
							Destacar cuesta <b>${CFG.precio}</b>. Tu publicación aparece
							primera y con etiqueta «Destacado».
						</p>
						<p>
							1. Pagá{" "}
							{CFG.link && (
								<a target="_blank" rel="noopener noreferrer" href={CFG.link}>
									con este link de pago (se abre en otra pestaña)
								</a>
							)}
							{CFG.link && CFG.alias ? " o " : ""}
							{CFG.alias && (
								<>
									por transferencia al alias <b>{CFG.alias}</b>
								</>
							)}
							.
						</p>
						<p>
							2.{" "}
							<a
								target="_blank"
								rel="noopener noreferrer"
								href={`https://wa.me/${String(CFG.wa).replace(/\D/g, "")}?text=${encodeURIComponent(
									`Hola! Pagué para destacar mi publicación en La Casa del Judoka: ${listing.title || ""}`,
								)}`}
							>
								Enviá el comprobante por WhatsApp (se abre en otra pestaña)
							</a>
							.
						</p>
						<p>3. Lo revisamos y la destacamos.</p>
					</div>
				)}
				{reviewsOpen && (
					<div id={reviewPanelId}>
						<ReviewPanel
							listing={listing}
							reviews={reviews}
							uid={uid}
							isAdmin={isAdmin}
							onAnnouncement={onAnnouncement}
						/>
					</div>
				)}
			</div>
		</article>
	);
}
