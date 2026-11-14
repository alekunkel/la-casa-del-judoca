import { useEffect, useState } from "react";

function readFavorites() {
	try {
		const stored = JSON.parse(localStorage.getItem("fav") || "[]");
		if (!Array.isArray(stored) || stored.some((item) => typeof item !== "string")) {
			throw new Error("Los favoritos guardados tienen un formato inválido.");
		}
		return { favorites: stored, error: null };
	} catch (error) {
		console.error("No se pudieron leer los favoritos.", error);
		return { favorites: [], error };
	}
}

export function useFavorites() {
	const [initial] = useState(readFavorites);
	const [favorites, setFavorites] = useState(initial.favorites);

	useEffect(() => {
		try {
			localStorage.setItem("fav", JSON.stringify(favorites));
		} catch (storageError) {
			console.error("No se pudieron guardar los favoritos.", storageError);
		}
	}, [favorites]);

	const toggleFavorite = (id) => {
		setFavorites((current) =>
			current.includes(id) ? current.filter((favorite) => favorite !== id) : [...current, id],
		);
	};

	return { favorites, toggleFavorite, error: initial.error };
}
