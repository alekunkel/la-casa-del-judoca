import process from "node:process";
import { applicationDefault, initializeApp } from "firebase-admin/app";

export function initializeAdminApp(projectId) {
	if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		throw new Error("Configurá GOOGLE_APPLICATION_CREDENTIALS con una credencial local del emulador.");
	}
	if (!projectId || projectId === "casa-del-judoca") {
		throw new Error("Indicá un proyecto de desarrollo explícito; el proyecto de producción está bloqueado.");
	}
	return initializeApp({
		credential: applicationDefault(),
		projectId,
	}, `local-admin-${projectId}`);
}

export function readProjectId(args) {
	const index = args.indexOf("--project");
	const projectId = index >= 0 ? args[index + 1] : "";
	if (!projectId || projectId.startsWith("--")) {
		throw new Error("Falta --project <id-de-desarrollo>.");
	}
	if (projectId === "casa-del-judoca") {
		throw new Error("Por seguridad, este script no opera sobre el proyecto de producción.");
	}
	return projectId;
}
