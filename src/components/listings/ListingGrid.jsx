import { useMemo, useState } from "react";
import ListingCard from "./ListingCard.jsx";
import ListingForm from "./ListingForm.jsx";
import { CategoryChips, Filters, LoadingMessage } from "./Filters.jsx";

export default function ListingGrid({
	listings,
	listingsLoading,
	listingsError,
	sellers,
	reviews,
	uid,
	isAdmin,
	favorites,
	onToggleFavorite,
	onLoginRequest,
	onAnnouncement,
}) {
	const [category, setCategory] = useState("");
	const [query, setQuery] = useState("");
	const [condition, setCondition] = useState("");
	const [sort, setSort] = useState("new");

	const visibleListings = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase();
		let result = listings.filter((listing) => {
			const approved = listing.status === "approved";
			const visible = approved || isAdmin || (!!uid && listing.owner === uid);
			const categoryMatches =
				!category ||
				(category === "__fav"
					? favorites.includes(listing.id)
					: (listing.cat || "Judogis") === category);
			const conditionMatches = !condition || listing.cond === condition;
			const searchMatches =
				!normalizedQuery ||
				`${String(listing.title || "")} ${String(listing.size || "")}`
					.toLowerCase()
					.includes(normalizedQuery);
			return visible && categoryMatches && conditionMatches && searchMatches;
		});
		if (sort !== "new") {
			result = [...result].sort((left, right) =>
				sort === "lo" ? left.price - right.price : right.price - left.price,
			);
		}
		return [...result.filter((listing) => listing.featured), ...result.filter((listing) => !listing.featured)];
	}, [category, condition, favorites, isAdmin, listings, query, sort, uid]);

	const availableCount = listings.filter(
		(listing) => !listing.sold && listing.status === "approved",
	).length;

	return (
		<section aria-label="Publicaciones">
			<ListingForm
				uid={uid}
				isAdmin={isAdmin}
				onLoginRequest={onLoginRequest}
				onAnnouncement={onAnnouncement}
			/>
			<CategoryChips value={category} onChange={setCategory} />
			<Filters
				query={query}
				condition={condition}
				sort={sort}
				onQueryChange={setQuery}
				onConditionChange={setCondition}
				onSortChange={setSort}
			/>
			<p className="sr-only" aria-live="polite">
				{listings.length
					? `${availableCount} ${availableCount === 1 ? "producto disponible" : "productos disponibles"}`
					: ""}
			</p>
			<div id="grid">
				{visibleListings.map((listing) => (
					<ListingCard
						key={listing.id}
						listing={listing}
						verified={sellers[listing.owner]?.verified === true}
						reviews={reviews}
						uid={uid}
						isAdmin={isAdmin}
						isFavorite={favorites.includes(listing.id)}
						onToggleFavorite={onToggleFavorite}
						onAnnouncement={onAnnouncement}
					/>
				))}
			</div>
			<LoadingMessage
				loading={listingsLoading}
				error={listingsError}
				count={visibleListings.length}
				hasListings={listings.length > 0}
			/>
		</section>
	);
}
