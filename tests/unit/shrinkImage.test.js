import { describe, expect, it, vi } from "vitest";
import { shrinkImage } from "../../src/utils/shrinkImage.js";

describe("shrinkImage", () => {
	it("devuelve sin cambios los formatos que no comprime", async () => {
		const file = new File(["gif"], "foto.gif", { type: "image/gif" });
		await expect(shrinkImage(file)).resolves.toBe(file);
	});

	it("usa la imagen JPEG reducida cuando pesa menos", async () => {
		const file = new File(["x".repeat(5000)], "foto.png", {
			type: "image/png",
		});
		const bitmap = { width: 1600, height: 800, close: vi.fn() };
		const context = {
			fillRect: vi.fn(),
			drawImage: vi.fn(),
			fillStyle: "",
		};
		const canvas = {
			width: 0,
			height: 0,
			getContext: vi.fn(() => context),
			toBlob: (callback) =>
				callback(new Blob(["small"], { type: "image/jpeg" })),
		};
		vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
		vi.spyOn(document, "createElement").mockImplementation((name) =>
			name === "canvas" ? canvas : document.createElement(name),
		);

		const result = await shrinkImage(file);
		expect(result.type).toBe("image/jpeg");
		expect(canvas.width).toBe(800);
		expect(bitmap.close).toHaveBeenCalledOnce();
	});
});
