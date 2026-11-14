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
	const [listingSnapshot, moderationSnapshot] = await Promise.all([
		firestore.collection("listings").get(),
		firestore.collection("mod").get(),
	]);
	const moderation = new Map(moderationSnapshot.docs.map((document) => [document.id, document.data()]));
	const changes = listingSnapshot.docs.flatMap((listing) => {
		const status = moderation.get(listing.id)?.approved === true ? "approved" : "pending";
		return listing.get("status") === status ? [] : [{ reference: listing.ref, id: listing.id, status }];
	});

	if (!apply) {
		for (const change of changes) {
			console.log(`Cambiaría ${change.id}: status=${change.status}`);
		}
		console.log(`Modo dry-run: ${changes.length} publicaciones cambiarían en ${projectId}. No se escribió nada.`);
	} else {
		for (let start = 0; start < changes.length; start += 450) {
			const batch = firestore.batch();
			changes.slice(start, start + 450).forEach(({ reference, status }) => batch.update(reference, { status }));
			await batch.commit();
		}
		console.log(`Se actualizó el status de ${changes.length} publicaciones en ${projectId}.`);
	}
} finally {
	await adminApp.delete();
}
