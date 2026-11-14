import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ListingGrid from "../../src/components/listings/ListingGrid.jsx";

vi.mock("../../src/services/listings.js", () => ({
	deleteListing: vi.fn(),
	updateListing: vi.fn(),
	setListingFeatured: vi.fn(),
	setListingStatus: vi.fn(),
}));
vi.mock("../../src/services/moderation.js", () => ({
	setSellerVerification: vi.fn(),
}));
vi.mock("../../src/services/reports.js", () => ({
	createReport: vi.fn(),
}));
vi.mock("../../src/services/reviews.js", () => ({
	createReview: vi.fn(),
	deleteReview: vi.fn(),
}));

const listings = [
	{
		id: "expensive",
		title: "Judogi caro",
		price: 30000,
		size: "A4",
		cond: "Nuevo",
		seller: "Vendedor",
		owner: "seller-1",
		wa: "5491122334455",
		photos: [],
		status: "approved",
		featured: false,
	},
	{
		id: "affordable",
		title: "Judogi accesible",
		price: 10000,
		size: "A1",
		cond: "Buen estado",
		seller: "Vendedora",
		owner: "seller-2",
		wa: "5491122334455",
		photos: [],
		status: "approved",
		featured: false,
	},
];

function renderGrid() {
	return render(
		<ListingGrid
			listings={listings}
			listingsLoading={false}
			listingsError={null}
			sellers={{}}
			reviews={[]}
			uid={null}
			isAdmin={false}
			favorites={[]}
			onToggleFavorite={vi.fn()}
			onLoginRequest={vi.fn()}
			onAnnouncement={vi.fn()}
		/>,
	);
}

describe("ListingGrid", () => {
	it("ordena por precio y filtra por talle", () => {
		const { container } = renderGrid();
		fireEvent.change(screen.getByLabelText("Ordenar"), {
			target: { value: "lo" },
		});
		const prices = Array.from(
			container.querySelectorAll(".card .pr"),
			(node) => node.textContent,
		);
		expect(prices).toEqual(["$10.000", "$30.000"]);

		fireEvent.change(screen.getByLabelText("Buscar"), {
			target: { value: "A4" },
		});
		expect(screen.getByText("Judogi caro")).toBeTruthy();
		expect(screen.queryByText("Judogi accesible")).toBeNull();
	});
});
