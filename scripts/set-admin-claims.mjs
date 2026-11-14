import console from "node:console";
import process from "node:process";
import { getAuth } from "firebase-admin/auth";
import { initializeAdminApp, readProjectId } from "./adminApp.mjs";

const args = process.argv.slice(2);
const projectId = readProjectId(args);
const uidIndex = args.indexOf("--uid");
const uid = uidIndex >= 0 ? args[uidIndex + 1] : "";
const makeAdmin = args.includes("--admin");
const removeAdmin = args.includes("--remove-admin");
if (!uid || uid.startsWith("--")) throw new Error("Falta --uid <uid>.");
if (makeAdmin === removeAdmin) throw new Error("Indicá exactamente uno: --admin o --remove-admin.");

const adminApp = initializeAdminApp(projectId);
try {
	const auth = getAuth(adminApp);
	const user = await auth.getUser(uid);
	if (makeAdmin && !user.emailVerified) {
		throw new Error("Solo se puede dar el claim de administración a una cuenta con correo verificado.");
	}
	const claims = { ...(user.customClaims || {}) };
	if (makeAdmin) claims.admin = true;
	else delete claims.admin;
	await auth.setCustomUserClaims(uid, claims);
	console.log(`Se ${makeAdmin ? "asignó" : "quitó"} el claim admin para ${uid} en ${projectId}.`);
} finally {
	await adminApp.delete();
}
