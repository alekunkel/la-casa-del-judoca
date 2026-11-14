import console from "node:console";
import process from "node:process";
import { getFirestore } from "firebase-admin/firestore";
import { initializeAdminApp, readProjectId } from "./adminApp.mjs";

const args = process.argv.slice(2);
const allowedArgs = new Set(["--dry-run", "--apply", "--project"]);
if (args.some((argument) => argument.startsWith("--") && !allowedArgs.has(argument))) {
	throw new Error("Argumento no reconocido.");
}
const projectId = readProjectId(args);
const apply = args.includes("--apply");
if (apply && args.includes("--dry-run")) {
	throw new Error("Elegí --apply o --dry-run, no los dos.");
}
const adminApp = initializeAdminApp(projectId);
const firestore = getFirestore(adminApp);

try {
	const [listingSnapshot, wantedSnapshot, moderationSnapshot] = await Promise.all([
		firestore.collection("listings").get(),
		firestore.collection("wanted").get(),
		firestore.collection("mod").get(),
	]);
	const moderation = new Map(
		moderationSnapshot.docs.map((document) => [document.id, document.data()]),
	);

	const listingChanges = listingSnapshot.docs.flatMap((listing) => {
		const nextStatus = moderation.get(listing.id)?.approved === true ? "approved" : "pending";
		const nextFeatured = moderation.get(listing.id)?.featured === true;
		const updates = {};
		if (listing.get("status") !== nextStatus) updates.status = nextStatus;
		if (listing.get("featured") !== nextFeatured) updates.featured = nextFeatured;
		return Object.keys(updates).length
			? [{ reference: listing.ref, id: listing.id, updates }]
			: [];
	});

	const wantedChanges = wantedSnapshot.docs.flatMap((item) => {
		const nextStatus = item.get("status") ?? (moderation.get(item.id)?.approved === true ? "approved" : "pending");
		return nextStatus === item.get("status")
			? []
			: [{ reference: item.ref, id: item.id, status: nextStatus }];
	});

	if (!apply) {
		console.log(`Listado: ${listingChanges.length} documentos cambiarían.`);
		for (const change of listingChanges) {
			console.log(`Cambiaría ${change.id}: ${JSON.stringify(change.updates)}`);
		}
		console.log(`Busquedas: ${wantedChanges.length} documentos cambiarían.`);
		for (const change of wantedChanges) {
			console.log(`Cambiaría ${change.id}: status=${change.status}`);
		}
		console.log(
			`Modo dry-run: ${listingChanges.length + wantedChanges.length} cambios en ${projectId}. No se escribió nada.`,
		);
	} else {
		for (let start = 0; start < listingChanges.length; start += 450) {
			const batch = firestore.batch();
			listingChanges.slice(start, start + 450).forEach(({ reference, updates }) => {
				batch.update(reference, updates);
			});
			await batch.commit();
		}
		for (let start = 0; start < wantedChanges.length; start += 450) {
			const batch = firestore.batch();
			wantedChanges.slice(start, start + 450).forEach(({ reference, status }) => {
				batch.update(reference, { status });
			});
			await batch.commit();
		}
		console.log(`Se actualizaron ${listingChanges.length + wantedChanges.length} documentos en ${projectId}.`);
	}
} finally {
	await adminApp.delete();
}
