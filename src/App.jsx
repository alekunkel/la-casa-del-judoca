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
		initializeFirebase();
		initializeLegacy();
	}, []);

	return parse(page, { transform: transformPageElement });
}
