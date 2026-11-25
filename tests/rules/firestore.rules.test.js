import { readFile } from "node:fs/promises";
import { afterAll, afterEach, beforeAll, it } from "vitest";
import {
	initializeTestEnvironment,
	assertFails,
	assertSucceeds,
} from "@firebase/rules-unit-testing";
import {
	collection,
	doc,
	getDoc,
	getDocs,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";

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

it("cada comprador puede dejar y actualizar su opinión, nunca sobre sí mismo ni en nombre de otra persona", async () => {
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
	// La misma persona puede actualizar su opinión.
	await assertSucceeds(setDoc(reviewRef, { ...review, rating: 4 }));
	// Otra persona no puede pisar la opinión ajena.
	const other = environment.authenticatedContext("other").firestore();
	await assertFails(setDoc(doc(other, "reviews/buyer_seller"), review));
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

it("un correo de administrador habilita la aprobación aunque no esté verificado", async () => {
	await environment.withSecurityRulesDisabled(async (context) => {
		await setDoc(doc(context.firestore(), "listings/by-email"), validListing);
	});
	const adminByEmail = environment
		.authenticatedContext("admin-email", {
			email: "davidjudo.23@gmail.com",
			email_verified: false,
		})
		.firestore();
	await assertSucceeds(
		updateDoc(doc(adminByEmail, "listings/by-email"), {
			...validListing,
			status: "approved",
		}),
	);
	const stranger = environment
		.authenticatedContext("stranger", {
			email: "otra@example.com",
			email_verified: true,
		})
		.firestore();
	await assertFails(
		updateDoc(doc(stranger, "listings/by-email"), { status: "pending" }),
	);
});

it("nadie puede publicar ya aprobada o destacada sin ser administrador", async () => {
	const seller = environment.authenticatedContext("seller").firestore();
	await assertFails(
		setDoc(doc(seller, "listings/self-approved"), {
			...validListing,
			status: "approved",
		}),
	);
	await assertFails(
		setDoc(doc(seller, "listings/self-featured"), {
			...validListing,
			featured: true,
		}),
	);
	const admin = environment
		.authenticatedContext("admin", { admin: true })
		.firestore();
	await assertSucceeds(
		setDoc(doc(admin, "listings/admin-approved"), {
			...validListing,
			owner: "admin",
			status: "approved",
		}),
	);
});

it("las consultas que usa la app están permitidas para cada tipo de persona", async () => {
	await environment.withSecurityRulesDisabled(async (context) => {
		const firestore = context.firestore();
		await setDoc(doc(firestore, "listings/approved"), {
			...validListing,
			status: "approved",
		});
		await setDoc(doc(firestore, "listings/pending-own"), validListing);
		await setDoc(doc(firestore, "listings/pending-other"), {
			...validListing,
			owner: "other",
		});
		await setDoc(doc(firestore, "wanted/approved"), {
			text: "Judogi",
			name: "Buscador",
			city: "",
			wa: "5491122334455",
			owner: "seller",
			ts: 1,
			status: "approved",
		});
	});
	const listings = (firestore) => collection(firestore, "listings");
	const wanted = (firestore) => collection(firestore, "wanted");

	const anonymous = environment.unauthenticatedContext().firestore();
	await assertSucceeds(
		getDocs(query(listings(anonymous), where("status", "==", "approved"))),
	);
	await assertFails(getDocs(listings(anonymous)));
	await assertSucceeds(
		getDocs(query(wanted(anonymous), where("status", "==", "approved"))),
	);
	await assertFails(getDocs(wanted(anonymous)));

	const seller = environment.authenticatedContext("seller").firestore();
	await assertSucceeds(
		getDocs(query(listings(seller), where("status", "==", "approved"))),
	);
	await assertSucceeds(
		getDocs(query(listings(seller), where("owner", "==", "seller"))),
	);
	await assertFails(getDocs(listings(seller)));

	const admin = environment
		.authenticatedContext("admin", { admin: true })
		.firestore();
	await assertSucceeds(getDocs(listings(admin)));
	await assertSucceeds(getDocs(wanted(admin)));
});
