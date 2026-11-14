import process from "node:process";
import { expect, test } from "@playwright/test";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const projectId = "casa-del-judoca-dev";
const adminApp = initializeApp({ projectId }, "playwright-emulator-admin");
const adminAuth = getAuth(adminApp);
const adminEmail = "davidjudo.23@gmail.com";
const adminPassword = "judoka-test-password";

async function ensureAdminAccount() {
	let user;
	try {
		user = await adminAuth.getUserByEmail(adminEmail);
	} catch (error) {
		if (error.code !== "auth/user-not-found") throw error;
		user = await adminAuth.createUser({
			email: adminEmail,
			password: adminPassword,
			emailVerified: true,
		});
	}
	if (!user.emailVerified)
		user = await adminAuth.updateUser(user.uid, { emailVerified: true });
	await adminAuth.setCustomUserClaims(user.uid, {
		...(user.customClaims || {}),
		admin: true,
	});
	return { email: adminEmail, password: adminPassword };
}

async function signUp(page, email) {
	await page.locator('button[aria-controls="auth"]').click();
	await page.locator("#auth").getByLabel("Correo electrónico").fill(email);
	await page
		.locator("#auth")
		.getByLabel("Contraseña (mínimo 6 caracteres)")
		.fill("judoka-test-password");
	await page.locator("#auth").getByRole("button", { name: "Crear cuenta" }).click();
	await expect(page.locator("#ok")).toContainText("Cuenta creada.");
}

async function signOut(page) {
	const panel = page.locator("#auth");
	if (!(await panel.isVisible().catch(() => false))) {
		await page.locator('button[aria-controls="auth"]').click();
	}
	if (await panel.getByRole("button", { name: "Salir" }).isVisible().catch(() => false)) {
		await panel.getByRole("button", { name: "Salir" }).click();
		await expect(page.locator('button[aria-controls="auth"]')).toBeVisible();
	}
}

async function signIn(page, email, password) {
	await signOut(page);
	const auth = page.locator("#auth");
	if (!(await auth.isVisible().catch(() => false))) {
		await page.locator('button[aria-controls="auth"]').click();
	}
	await auth.getByLabel("Correo electrónico").fill(email);
	await auth.getByLabel("Contraseña (mínimo 6 caracteres)").fill(password);
	await auth.getByRole("button", { name: "Ingresar", exact: true }).click();
	await expect(page.locator("#ok")).toHaveText("Ingresaste correctamente.");
}

async function publishListing(page, title) {
	await page.getByRole("button", { name: "Publicar mi producto" }).click();
	await page.locator("#listing-form").getByLabel("Tu nombre").fill("Vendedor de prueba");
	await page.locator("#listing-form").getByLabel("Título").fill(title);
	await page.locator("#listing-form").getByLabel("Categoría").selectOption("Judogis");
	await page.locator("#listing-form").getByLabel("Talle").fill("A3");
	await page.locator("#listing-form").getByLabel("Estado").selectOption("Muy buen estado");
	await page.locator("#listing-form").getByLabel("Precio ($)").fill("15000");
	await page
		.locator("#listing-form")
		.getByLabel("WhatsApp (con código de país)")
		.fill("5491122334455");
	await page
		.locator("#listing-form")
		.getByRole("button", { name: "Publicar" })
		.click();
}

test("registrarse y recibir el aviso de verificación", async ({ page }) => {
	await page.goto("/");
	await signUp(page, `alta-${Date.now()}@example.com`);
	await expect(page.locator("#ok")).toContainText("confirmar tu dirección");
});

test("publicar un producto y verlo en revisión", async ({ page }) => {
	await page.goto("/");
	const sellerEmail = `vendedor-${Date.now()}@example.com`;
	await signUp(page, sellerEmail);
	await signOut(page);
	await signIn(page, sellerEmail, "judoka-test-password");
	const title = `Judogi pendiente ${Date.now()}`;
	await publishListing(page, title);
	await expect(page.locator("#ok")).toContainText(
		"aparece cuando la revisemos",
	);
	await expect(page.getByText("En revisión").first()).toBeVisible();
});

test("administración aprueba una publicación y queda visible en público", async ({
	page,
	browser,
}) => {
	await page.goto("/");
	const sellerEmail = `aprobacion-${Date.now()}@example.com`;
	await signUp(page, sellerEmail);
	await signOut(page);
	await signIn(page, sellerEmail, "judoka-test-password");
	const title = `Judogi para aprobar ${Date.now()}`;
	await publishListing(page, title);
	await expect(page.locator("#ok")).toContainText(
		"aparece cuando la revisemos",
	);

	await signOut(page);

	const admin = await ensureAdminAccount();
	await signIn(page, admin.email, admin.password);
	await page
		.getByRole("region", { name: "Panel del administrador" })
		.getByRole("button", {
			name: new RegExp(`^Aprobar publicación: ${title}$`),
		})
		.click();

	const publicPage = await browser.newPage();
	await publicPage.goto("/");
	await expect(publicPage.getByText(title)).toBeVisible();
	await publicPage.close();
});

test("una persona compradora puede dejar una opinión", async ({ page }) => {
	await page.goto("/");
	const admin = await ensureAdminAccount();
	await signIn(page, admin.email, admin.password);
	const title = `Judogi con opinión ${Date.now()}`;
	await publishListing(page, title);
	await expect(page.locator("#ok")).toHaveText("Publicación creada.");
	await signOut(page);

	const buyerEmail = `comprador-${Date.now()}@example.com`;
	await signUp(page, buyerEmail);
	await signOut(page);
	await signIn(page, buyerEmail, "judoka-test-password");
	await page
		.getByRole("button", { name: `Ver u opinar sobre el vendedor de ${title}` })
		.click();
	await page
		.getByRole("region", { name: "Opiniones sobre el vendedor" })
		.getByLabel("Tu nombre")
		.fill("Comprador de prueba");
	await page
		.getByRole("region", { name: "Opiniones sobre el vendedor" })
		.getByLabel("Comentario (opcional)")
		.fill("Opinión del emulador");
	await page
		.getByRole("region", { name: "Opiniones sobre el vendedor" })
		.getByRole("button", { name: "Enviar opinión" })
		.click();
	await expect(page.locator("#ok")).toContainText("Gracias por tu opinión.");
});
