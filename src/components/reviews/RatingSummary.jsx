export function getRatingSummary(reviews, sellerUid) {
	const sellerReviews = reviews.filter((review) => review.seller === sellerUid);
	if (!sellerUid || !sellerReviews.length) return "";
	const average =
		sellerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
		sellerReviews.length;
	return ` · Valoración ${average.toFixed(1).replace(".", ",")} de 5 (${sellerReviews.length} ${
		sellerReviews.length === 1 ? "opinión" : "opiniones"
	})`;
}

export default function RatingSummary({ reviews, sellerUid }) {
	return <>{getRatingSummary(reviews, sellerUid)}</>;
}
