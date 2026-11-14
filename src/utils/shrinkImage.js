export async function shrinkImage(file) {
	try {
		if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
		const bitmap = await createImageBitmap(file);
		const maxSize = 800;
		const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(bitmap.width * scale);
		canvas.height = Math.round(bitmap.height * scale);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("No se pudo preparar la foto.");
		context.fillStyle = "#fff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
		bitmap.close();
		const compressed = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.7));
		return compressed && compressed.size < file.size ? compressed : file;
	} catch (error) {
		console.error("No se pudo reducir la foto; se usará el archivo original.", error);
		return file;
	}
}
