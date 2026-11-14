import { useState } from "react";
import { createReview, deleteReview } from "../../services/reviews.js";

export default function ReviewPanel({
	listing,
	reviews,
	uid,
	isAdmin,
	onAnnouncement,
}) {
	const [rating, setRating] = useState("5");
	const [name, setName] = useState("");
	const [text, setText] = useState("");
	const [message, setMessage] = useState("");
	const visibleReviews = reviews
		.filter((review) => review.seller === listing.owner)
		.sort((left, right) => (right.ts || 0) - (left.ts || 0))
		.slice(0, 5);

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!name.trim()) {
			setMessage("Escribí tu nombre.");
			return;
		}
		try {
			await createReview(uid, listing.owner, {
				sellerName: listing.seller || "",
				rating: Number(rating),
				name: name.trim(),
				text: text.trim(),
				ts: Date.now(),
			});
			setMessage("Gracias por tu opinión.");
			setName("");
			setText("");
			onAnnouncement("Gracias por tu opinión.");
		} catch (error) {
			console.error("No se pudo enviar la opinión.", error);
			setMessage("No se pudo enviar la opinión.");
		}
	};

	const handleDelete = async (review) => {
		if (!window.confirm("¿Borrar esta opinión?")) return;
		try {
			await deleteReview(review.id);
			onAnnouncement("Opinión borrada.");
		} catch (error) {
			console.error("No se pudo borrar la opinión.", error);
			setMessage("No se pudo borrar la opinión.");
		}
	};

	return (
		<div
			className="pay rev"
			role="region"
			aria-label="Opiniones sobre el vendedor"
		>
			{visibleReviews.length ? (
				visibleReviews.map((review) => (
					<div key={review.id}>
						<p>
							{review.rating} de 5{review.name ? ` · ${review.name}` : ""}
							{review.text ? `: ${review.text}` : ""}
						</p>
						{isAdmin && (
							<button
								type="button"
								className="x"
								onClick={() => handleDelete(review)}
							>
								Borrar opinión
								<span className="sr-only">
									{" "}
									de {review.name || "comprador"}
								</span>
							</button>
						)}
					</div>
				))
			) : (
				<p>Todavía no hay opiniones de este vendedor.</p>
			)}
			{uid && listing.owner && uid !== listing.owner ? (
				<form className="on" onSubmit={handleSubmit}>
					<p>
						<b>Dejá tu opinión como comprador:</b>
					</p>
					<label htmlFor={`review-rating-${listing.id}`}>Puntaje</label>
					<select
						id={`review-rating-${listing.id}`}
						value={rating}
						onChange={(event) => setRating(event.target.value)}
					>
						<option value="5">5 - Excelente</option>
						<option value="4">4 - Muy bueno</option>
						<option value="3">3 - Bueno</option>
						<option value="2">2 - Regular</option>
						<option value="1">1 - Malo</option>
					</select>
					<label htmlFor={`review-name-${listing.id}`}>Tu nombre</label>
					<input
						id={`review-name-${listing.id}`}
						maxLength="40"
						required
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
					<label htmlFor={`review-text-${listing.id}`}>
						Comentario (opcional)
					</label>
					<input
						id={`review-text-${listing.id}`}
						maxLength="200"
						value={text}
						onChange={(event) => setText(event.target.value)}
					/>
					<button className="btn" type="submit">
						Enviar opinión
					</button>
				</form>
			) : !uid ? (
				<p className="m">Iniciá sesión para dejar una opinión.</p>
			) : null}
			<p className="m" role="status" aria-live="polite">
				{message}
			</p>
		</div>
	);
}
