import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ListingCard from "../../src/components/listings/ListingCard.jsx";

vi.mock("../../src/services/listings.js", () => ({
	deleteListing: vi.fn(),
	updateListing: vi.fn(),
	setListingFeatured: vi.fn(),
	setListingStatus: vi.fn(),
}));
vi.mock("../../src/services/sellers.js", () => ({
	setSellerVerification: vi.fn(),
}));
vi.mock("../../src/services/reports.js", () => ({
	createReport: vi.fn(),
}));
vi.mock("../../src/services/reviews.js", () => ({
	createReview: vi.fn(),
	deleteReview: vi.fn(),
}));

describe("ListingCard", () => {
	it("muestra la descripción alternativa y el estado del favorito", () => {
		render(
			<ListingCard
				listing={{
					id: "listing-1",
					title: "Judogi blanco",
					price: 10000,
					size: "A3",
					cond: "Muy buen estado",
					seller: "Vendedor",
					owner: "seller",
					wa: "5491122334455",
					alt: "Judogi doblado sobre una mesa",
					photos: ["data:image/jpeg;base64,photo"],
					sold: false,
					status: "approved",
					featured: false,
				}}
				verified={false}
				reviews={[]}
				uid={null}
				isAdmin={false}
				isFavorite={true}
				onToggleFavorite={vi.fn()}
				onAnnouncement={vi.fn()}
			/>,
		);

		expect(
			screen.getByRole("img", { name: "Judogi doblado sobre una mesa" }),
		).toBeTruthy();
		expect(
			screen
				.getByRole("button", { name: "Quitar de favoritos: Judogi blanco" })
				.getAttribute("aria-pressed"),
		).toBe("true");
	});
});
