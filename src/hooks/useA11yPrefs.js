import { useEffect, useState } from "react";

const defaults = { fs: "", th: "", sp: "", ul: "" };
const classes = ["big", "xl", "hc", "dk", "sp", "ul"];
const allowedValues = {
	fs: ["", "big", "xl"],
	th: ["", "hc", "dk"],
	sp: ["", "sp"],
	ul: ["", "ul"],
};

function applyPreferences(preferences) {
	const root = document.documentElement;
	root.classList.remove(...classes);
	[preferences.fs, preferences.th, preferences.sp, preferences.ul]
		.filter(Boolean)
		.forEach((className) => root.classList.add(className));
}

function readPreferences() {
	try {
		const stored = JSON.parse(localStorage.getItem("a11y") || "{}");
		const safePreferences = { ...defaults };
		Object.keys(allowedValues).forEach((group) => {
			if (allowedValues[group].includes(stored[group])) safePreferences[group] = stored[group];
		});
		return { preferences: safePreferences, error: null };
	} catch (error) {
		console.error("No se pudieron leer las preferencias de accesibilidad.", error);
		return { preferences: defaults, error };
	}
}

export function useA11yPrefs() {
	const [initial] = useState(readPreferences);
	const [preferences, setPreferences] = useState(initial.preferences);

	useEffect(() => {
		applyPreferences(preferences);
		try {
			localStorage.setItem("a11y", JSON.stringify(preferences));
		} catch (storageError) {
			console.error("No se pudieron guardar las preferencias de accesibilidad.", storageError);
		}
	}, [preferences]);

	const setPreference = (group, value, toggle = false) => {
		setPreferences((current) => ({
			...current,
			[group]: toggle && current[group] === value ? "" : value,
		}));
	};

	const resetPreferences = () => setPreferences(defaults);

	return { preferences, setPreference, resetPreferences, error: initial.error };
}
