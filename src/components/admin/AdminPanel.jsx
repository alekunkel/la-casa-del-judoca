import { deleteListing } from "../../services/listings.js";
import { deleteReport } from "../../services/reports.js";
import { setModeration } from "../../services/moderation.js";
import { deleteWanted } from "../../services/wanted.js";

export default function AdminPanel({
	isAdmin,
	listings,
	wanted,
	reports,
	reviews,
	moderation,
	onAnnouncement,
}) {
	if (!isAdmin) return null;
	const pendingListings = listings.filter((listing) => moderation[listing.id]?.approved !== true);
	const pendingWanted = wanted.filter((item) => moderation[item.id]?.approved !== true);
	const featuredCount = listings.filter((listing) => moderation[listing.id]?.featured).length;
	const summary = [
		`${pendingListings.length} publicaciones por aprobar`,
		`${pendingWanted.length} búsquedas por aprobar`,
		`${reports.length} denuncias`,
		`${featuredCount} destacados activos`,
		`${reviews.length} opiniones en total`,
	];

	const runAction = async (action, success, failure) => {
		try {
			await action();
			onAnnouncement(success);
		} catch (error) {
			console.error(failure, error);
			onAnnouncement(failure);
		}
	};

	return (
		<section className="info" id="adm" aria-labelledby="admin-heading">
			<h2 id="admin-heading">Panel del administrador</h2>
			<ul>
				{summary.map((line) => (
					<li key={line}>{line}</li>
				))}
			</ul>
			<div>
				{pendingListings.map((listing) => (
					<div key={listing.id} className="pay">
						<p>
							Publicación: {listing.title || ""} — {listing.seller || "sin nombre"}
						</p>
						<div className="acts">
							<button
								className="x"
								type="button"
								aria-label={`Aprobar publicación: ${listing.title}`}
								onClick={() =>
									runAction(
										() => setModeration(listing.id, { approved: true }),
										"Publicación aprobada.",
										"No se pudo aprobar.",
									)
								}
							>
								Aprobar
							</button>
							<button
								className="x"
								type="button"
								aria-label={`Rechazar y borrar publicación: ${listing.title}`}
								onClick={() =>
									window.confirm("¿Borrar esta publicación?")
										? runAction(
												() => deleteListing(listing.id),
												"Publicación borrada.",
												"No se pudo borrar.",
											)
										: undefined
								}
							>
								Rechazar y borrar
							</button>
						</div>
					</div>
				))}
				{pendingWanted.map((item) => (
					<div key={item.id} className="pay">
						<p>
							Búsqueda: {item.text} — {item.name}
						</p>
						<div className="acts">
							<button
								className="x"
								type="button"
								aria-label={`Aprobar búsqueda: ${item.text}`}
								onClick={() =>
									runAction(
										() => setModeration(item.id, { approved: true }),
										"Búsqueda aprobada.",
										"No se pudo aprobar.",
									)
								}
							>
								Aprobar
							</button>
							<button
								className="x"
								type="button"
								aria-label={`Rechazar y borrar búsqueda: ${item.text}`}
								onClick={() =>
									window.confirm("¿Borrar esta búsqueda?")
										? runAction(
												() => deleteWanted(item.id),
												"Búsqueda borrada.",
												"No se pudo borrar.",
											)
										: undefined
								}
							>
								Rechazar y borrar
							</button>
						</div>
					</div>
				))}
				{reports.map((report) => (
					<div key={report.id} className="pay">
						<p>Denuncia sobre: {report.title || report.listing}</p>
						<div className="acts">
							<button
								className="x"
								type="button"
								aria-label={`Ocultar publicación denunciada: ${report.title || ""}`}
								onClick={() =>
									runAction(
										() => setModeration(report.listing, { approved: false }),
										"Publicación ocultada.",
										"No se pudo ocultar la publicación.",
									)
								}
							>
								Ocultar publicación
							</button>
							<button
								className="x"
								type="button"
								aria-label={`Descartar denuncia sobre ${report.title || ""}`}
								onClick={() =>
									runAction(
										() => deleteReport(report.id),
										"Denuncia descartada.",
										"No se pudo descartar la denuncia.",
									)
								}
							>
								Descartar denuncia
							</button>
						</div>
					</div>
				))}
			</div>
		</section>
	);
}
