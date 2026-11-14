import { cloneElement, useEffect } from "react";
import parse from "html-react-parser";
import page from "./page.html?raw";
import { initializeFirebase } from "./firebase.js";
import { initializeLegacy } from "./legacy.js";
import "./styles.css";

function transformPageElement(element, node) {
	if (node.type !== "tag") return element;

	if (node.name === "select" && node.attribs.id === "c") {
		return cloneElement(element, { defaultValue: "Muy buen estado" });
	}

	if (node.name === "option" && node.attribs.selected !== undefined) {
		const props = { ...element.props };
		delete props.selected;
		return cloneElement(element, props);
	}

	return element;
}

export default function App() {
	useEffect(() => {
		let active = true;
		let cleanupLegacy = () => {};
		initializeFirebase()
			.then((services) => {
				if (active) cleanupLegacy = initializeLegacy(services);
			})
			.catch((error) => {
				console.error("No se pudo inicializar Firebase.", error);
				const warning = document.getElementById("cfgwarn");
				if (warning) {
					warning.textContent = "No se pudo conectar con Firebase. Revisá tu conexión y probá de nuevo.";
					warning.hidden = false;
				}
			});
		return () => {
			active = false;
			cleanupLegacy();
		};
	}, []);

	return parse(page, { transform: transformPageElement });
}
