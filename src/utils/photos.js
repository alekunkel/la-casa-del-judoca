const MAX_DATA_URL_LENGTH = 230000;

export function fileToDataUrl(file) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const dataUrl = String(reader.result);
			if (dataUrl.length > MAX_DATA_URL_LENGTH) {
				reject(new Error("foto muy pesada"));
				return;
			}
			resolve(dataUrl);
		};
		reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer la foto."));
		reader.readAsDataURL(file);
	});
}
