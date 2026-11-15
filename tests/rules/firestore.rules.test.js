import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, it } from "vitest";
import {
	initializeTestEnvironment,
	assertFails,
	assertSucceeds,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const projectId = "casa-del-judoca-dev";
let environment;
const validListing = {
	title: "Judogi blanco",
	seller: "Vendedor",
	size: "A3",
	alt: "",
	pay: ["Efectivo"],
	ship: ["Retiro en persona"],
	city: "Rosario",
	cat: "Judogis",
	sold: false,
	cond: "Muy buen estado",
	price: 1000,
	wa: "5491122334455",
	photo: null,
	photos: [],
	owner: "seller",
	ts: 1,
	status: "pending",
	featured: false,
};

beforeAll(async () => {
	const rules = await readFile(
		new URL("../../firestore.rules", import.meta.url),
		"utf8",
	);
	environment = await initializeTestEnvironment({
		projectId,
		firestore: { rules },
	});
});

afterEach(async () => environment.clearFirestore());
afterAll(async () => environment.cleanup());

it("una persona anónima lee publicaciones aprobadas, pero no pendientes", async () => {
	await environment.withSecurityRulesDisabled(async (context) => {
		const firestore = context.firestore();
		await setDoc(doc(firestore, "listings/approved"), {
			...validListing,
			status: "approved",
		});
		await setDoc(doc(firestore, "listings/pending"), validListing);
	});
	const firestore = environment.unauthenticatedContext().firestore();
	await assertSucceeds(getDoc(doc(firestore, "listings/approved")));
	await assertFails(getDoc(doc(firestore, "listings/pending")));
});

it("valida la creación de publicaciones y búsquedas", async () => {
	const firestore = environment.authenticatedContext("seller").firestore();
	await assertSucceeds(setDoc(doc(firestore, "listings/new"), validListing));
	await assertFails(
		setDoc(doc(firestore, "listings/invalid"), { ...validListing, price: -1 }),
	);
	await assertFails(
		setDoc(doc(firestore, "listings/wrong-owner"), {
			...validListing,
			owner: "other",
		}),
	);
	await assertSucceeds(
		setDoc(doc(firestore, "wanted/wanted-1"), {
			text: "Judogi blanco talle 4",
			name: "Buscador",
			city: "",
			wa: "5491122334455",
			owner: "seller",
			ts: 1,
			status: "pending",
		}),
	);
	await assertFails(
		setDoc(doc(firestore, "wanted/wanted-invalid"), {
			text: "x".repeat(101),
			name: "Buscador",
			city: "",
			wa: "5491122334455",
			owner: "seller",
			ts: 1,
			status: "pending",
		}),
	);
});

it("la persona dueña no puede editar status ni destacar su publicación", async () => {
	await environment.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(context.firestore(), "listings/owned"), validListing);
	});
	const firestore = environment.authenticatedContext("seller").firestore();
	await assertSucceeds(
		updateDoc(doc(firestore, "listings/owned"), {
			title: "Judogi actualizado",
		}),
	);
	await assertFails(
		updateDoc(doc(firestore, "listings/owned"), { status: "approved" }),
	);
	await assertFails(
		updateDoc(doc(firestore, "listings/owned"), { featured: true }),
	);
});

it("el claim de administrador habilita la aprobación", async () => {
	await environment.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(context.firestore(), "listings/to-approve"), validListing);
	});
	const firestore = environment
		.authenticatedContext("admin", { admin: true })
		.firestore();
	await assertSucceeds(
		updateDoc(doc(firestore, "listings/to-approve"), {
			...validListing,
			status: "approved",
		}),
	);
});

it("cada comprador puede dejar una opinión válida por vendedor y nunca sobre sí mismo", async () => {
	const firestore = environment.authenticatedContext("buyer").firestore();
	const review = {
		seller: "seller",
		sellerName: "Vendedor",
		rating: 5,
		name: "Comprador",
		text: "Todo bien",
		by: "buyer",
		ts: 1,
	};
	const reviewRef = doc(firestore, "reviews/buyer_seller");
	await assertSucceeds(setDoc(reviewRef, review));
	await assertSucceeds(setDoc(reviewRef, review));
	await assertFails(
		setDoc(doc(firestore, "reviews/buyer_buyer"), {
			...review,
			seller: "buyer",
		}),
	);
	await assertFails(
		setDoc(doc(firestore, "reviews/bad-rating"), { ...review, rating: 6 }),
	);
});

it("solo administración puede leer denuncias", async () => {
	await environment.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(context.firestore(), "reports/report-1"), {
			listing: "listing-1",
			title: "Judogi",
			ts: 1,
			by: "buyer",
		});
	});
	const publicFirestore = environment.unauthenticatedContext().firestore();
	const adminFirestore = environment
		.authenticatedContext("admin", { admin: true })
		.firestore();
	await assertFails(getDoc(doc(publicFirestore, "reports/report-1")));
	await assertSucceeds(getDoc(doc(adminFirestore, "reports/report-1")));
});
