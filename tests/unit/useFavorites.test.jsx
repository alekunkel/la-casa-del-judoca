import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFavorites } from "../../src/hooks/useFavorites.js";

describe("useFavorites", () => {
	it("carga, actualiza y persiste favoritos", async () => {
		localStorage.setItem("fav", JSON.stringify(["listing-1"]));
		const { result } = renderHook(() => useFavorites());
		expect(result.current.favorites).toEqual(["listing-1"]);

		act(() => result.current.toggleFavorite("listing-2"));
		await waitFor(() => {
			expect(JSON.parse(localStorage.getItem("fav"))).toEqual([
				"listing-1",
				"listing-2",
			]);
		});
	});
});
