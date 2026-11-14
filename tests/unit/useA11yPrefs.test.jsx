import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useA11yPrefs } from "../../src/hooks/useA11yPrefs.js";

describe("useA11yPrefs", () => {
	it("aplica y restaura preferencias persistidas", async () => {
		localStorage.setItem(
			"a11y",
			JSON.stringify({ fs: "xl", th: "dk", sp: "sp", ul: "" }),
		);
		const { result } = renderHook(() => useA11yPrefs());
		await waitFor(() =>
			expect(document.documentElement.classList.contains("xl")).toBe(true),
		);
		expect(document.documentElement.classList.contains("dk")).toBe(true);

		act(() => result.current.resetPreferences());
		await waitFor(() =>
			expect(document.documentElement.classList.contains("xl")).toBe(false),
		);
		expect(JSON.parse(localStorage.getItem("a11y"))).toEqual({
			fs: "",
			th: "",
			sp: "",
			ul: "",
		});
	});
});
