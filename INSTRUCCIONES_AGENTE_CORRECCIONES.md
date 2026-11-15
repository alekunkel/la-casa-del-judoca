# Instrucciones para el agente: corregir los errores hallados en la revisión

> Copiar a la raíz del repo como `MIGRATION_FIXES.md`. Las reglas de oro de `INSTRUCCIONES_AGENTE_MIGRACION.md` siguen vigentes: un paso, un commit; accesibilidad primero; no tocar producción; no inventar.

## 0. Contexto

Una revisión de todo el código encontró los problemas de abajo. El orden de las fases es el orden de prioridad. Trabajá en una rama nueva (`correcciones`) creada desde `migracion-react`/`main`, según corresponda al estado actual del repo (verificalo con `git status` y `git log`).

Reglas extra para esta tarea:
1. **Nunca ejecutes `firebase deploy`, scripts de datos con `--apply`, ni nada contra el proyecto de producción `casa-del-judoca`.**
2. **No imprimas ni commitees** `.env.local`, `firebase-debug.log` ni `firestore-debug.log`.
3. **No declares "pasó" un comando que no ejecutaste.** Para cada comando de verificación, anotá en `MIGRATION_LOG.md`: comando, resultado real, o el motivo exacto por el que no pudiste correrlo.
4. Todo texto visible para usuarios y todos los commits van en español rioplatense.

## Fase A: Docker (`.dockerignore`)

**Problema:** el archivo se llama `_.dockerignore`, así que Docker lo ignora. `COPY . .` copia `node_modules` de Windows y `.env.local` al contexto, pisando el `node_modules` que instala `npm ci` en Linux.

- **A.1** `git mv _.dockerignore .dockerignore`. Verificá que el contenido incluya al menos: `node_modules`, `dist`, `.git`, `.github`, `.env`, `.env.*` (con `!.env.example`), `playwright-report`, `test-results`, `*.log`.
- **A.2** Si Docker está disponible: `docker compose --env-file .env.local build --no-cache` y confirmá que el build termina sin error. Si no está disponible, anotalo en el log.

## Fase B: consultas a Firestore (la causa probable de "No se pudieron cargar todos los datos")

**Problema:** `subscribeVisibleListings` y `subscribeVisibleWanted` combinan `where(...)` con `orderBy("ts")`, lo que exige un índice compuesto en producción (el emulador no lo exige, por eso nadie lo vio). Además, el mapa combinado nunca elimina documentos: lo borrado u ocultado queda visible hasta recargar.

- **B.1** Creá `src/services/visible.js` con este contenido exacto:

```js
import { onSnapshot, orderBy, query, where } from "firebase/firestore";

// Suscripción a los documentos que la persona puede ver, compatible con las reglas:
//  - admin: toda la colección
//  - con sesión: las aprobadas + las propias (dos consultas, combinadas sin duplicados)
//  - anónima: solo las aprobadas
//
// Las consultas filtradas NO usan orderBy a propósito: filtrar por un campo y ordenar
// por otro exige un índice compuesto en Firestore (en el emulador no se nota, en
// producción la consulta falla). El orden por fecha se hace acá, en el cliente.
export function subscribeVisible(collectionRef, { uid, isAdmin }, onData, onError) {
	let queries;
	if (isAdmin) {
		queries = [query(collectionRef, orderBy("ts", "desc"))];
	} else if (uid) {
		queries = [
			query(collectionRef, where("status", "==", "approved")),
			query(collectionRef, where("owner", "==", uid)),
		];
	} else {
		queries = [query(collectionRef, where("status", "==", "approved"))];
	}

	// Último resultado de cada consulta. Se reemplaza entero en cada snapshot, así los
	// documentos borrados u ocultados desaparecen.
	const results = queries.map(() => null);

	const emit = () => {
		if (results.some((docs) => docs === null)) return; // esperar a que respondan todas
		const merged = new Map();
		for (const docs of results) {
			for (const item of docs) merged.set(item.id, item);
		}
		onData(
			Array.from(merged.values()).sort(
				(left, right) => (right.ts ?? 0) - (left.ts ?? 0),
			),
		);
	};

	const unsubscribers = queries.map((queryRef, index) =>
		onSnapshot(
			queryRef,
			(snapshot) => {
				results[index] = snapshot.docs.map((item) => ({
					id: item.id,
					...item.data(),
				}));
				emit();
			},
			onError,
		),
	);

	return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
```

- **B.2** En `src/services/listings.js` y `src/services/wanted.js`: borrá `where` de los imports, importá `subscribeVisible` desde `./visible.js` y dejá `subscribeVisibleListings(access, onData, onError)` / `subscribeVisibleWanted(access, onData, onError)` como una línea que llama a `subscribeVisible(<colección>, access, onData, onError)`. El resto de las funciones exportadas no cambia.
- **B.3** Test unitario `tests/unit/visible.test.js` con `firebase/firestore` mockeado. Debe cubrir:
  - anónimo → una consulta con `where status == approved` y **sin** `orderBy`;
  - con sesión → dos consultas (`status` y `owner == uid`), sin `orderBy`, resultado combinado sin duplicados;
  - admin → una consulta con `orderBy("ts","desc")`;
  - **eliminación:** si un snapshot posterior ya no trae un documento, `onData` deja de incluirlo;
  - no se llama a `onData` hasta que respondieron todas las consultas;
  - el resultado sale ordenado por `ts` descendente;
  - la función devuelta cancela todas las suscripciones.
- **B.4** Test de reglas (ver Fase C.3) que pruebe estas mismas consultas contra el emulador.

## Fase C: una sola fuente de verdad para las reglas

**Problema:** producción usa `firestore.rules`, pero `firebase.dev.json` (emulador/E2E) y `tests/rules/` usan `firestore.rules.v2`. Las dos versiones difieren (`hasOnly`, respaldo de admin por correo, edición de opiniones), así que lo que se prueba no es lo que se publica.

- **C.1** Tomá `firestore.rules` como fuente de verdad. Revisá el diff con `firestore.rules.v2` y decidí, anotándolo en el log, qué restricciones de v2 conviene portar (por ejemplo `hasOnly` en `listings`/`wanted`/`reviews`), **sin romper** lo que la interfaz envía hoy: `ListingForm` manda `title, seller, size, alt, pay, ship, city, cat, sold, cond, price, wa, photo, photos, owner, ts, status, featured`; `WantedSection` manda `text, name, city, wa, owner, ts, status`; `createReview` manda `sellerName, rating, name, text, ts, by, seller`. Si portás `hasOnly`, hacelo coincidir con esas listas y agregá un test que lo demuestre.
- **C.2** Cambiá `firebase.dev.json` para usar `"rules": "firestore.rules"` y el test de reglas para leer `firestore.rules`. Borrá `firestore.rules.v2` (`git rm`) y actualizá toda mención (`README.md`, `LEEME-guia.txt`, `docs/SEGURIDAD.md`, `docs/PLAN_DESPLIEGUE.md`, `MIGRATION_LOG.md`, `INSTRUCCIONES_*`).
- **C.3** En `tests/rules/firestore.rules.test.js` agregá casos con `getDocs(query(...))`:
  - anónimo: la consulta `where status == approved` **funciona**; leer la colección completa **falla**;
  - usuario con sesión: la consulta `where owner == uid` funciona; no ve `pending` ajenos;
  - admin por claim: lee todo; admin **solo por correo verificado** (transitorio): también lee todo (`authenticatedContext(uid, { email, email_verified: true })`); correo sin verificar: no;
  - usuario común no puede crear con `status: "approved"` ni `featured: true`; admin sí puede crear `approved`;
  - el dueño no puede cambiar `status` ni `featured`; marcar `sold` sí;
  - `wanted`: mismas reglas de visibilidad, creación y aprobación;
  - opiniones: el autor puede reenviar la suya (la interfaz usa `setDoc` sobre el mismo id), no puede opinar sobre sí mismo ni con otro `by`.
- **C.4** Ejecutá `npm run test:rules` y `npm run test:e2e` si el entorno lo permite (necesitan Java). Si algún test del E2E dependía de la regla v2 (por ejemplo opiniones), ajustalo y explicalo en el log.

## Fase D: scripts de migración

**Problemas:**
1. `migrate-status.mjs` recalcula `status` y `featured` desde `mod` **siempre**: si se corre después de que la app nueva ya se usó, revierte aprobaciones a "pendiente".
2. `adminApp.mjs` bloquea el id `casa-del-judoca`, que es el de producción real, así que los scripts no se pueden usar donde hacen falta.
3. El mensaje de `GOOGLE_APPLICATION_CREDENTIALS` dice "del emulador", pero se usa una credencial real.

- **D.1** Extraé la lógica a una función pura `computeChanges({ listings, wanted, moderation })` en `scripts/lib/migration.mjs`, que **solo completa lo que falta**:
  - `status`: usa el existente; si no hay, `approved` solo si `moderation[id].approved === true`, si no `pending`;
  - `featured`: usa el existente; si no hay, `moderation[id].featured === true`;
  - `wanted.status` igual que `status`;
  - devuelve cambios vacíos cuando todo ya está migrado (idempotente).
- **D.2** Tests en `tests/unit/migration.test.js`: documento ya migrado no cambia; documento sin `status` con `mod.approved` → `approved`; documento con `status: "approved"` y **sin** entrada en `mod` **no** vuelve a `pending`; segunda pasada sin cambios.
- **D.3** `migrate-status.mjs` usa `computeChanges`. `--dry-run` es el modo por defecto y puede correr contra cualquier proyecto (solo lee).
- **D.4** Para `--apply` sobre el proyecto de producción: exigí el flag `--allow-production` **y** que la persona escriba el id del proyecto en la terminal para confirmar; antes de escribir, imprimí un recordatorio de hacer una exportación de respaldo de Firestore. Aplicá la misma regla a `set-admin-claims.mjs`.
- **D.5** Corregí los mensajes ("credencial de servicio con permisos sobre el proyecto indicado").
- **D.6** Documentá en `docs/PLAN_DESPLIEGUE.md` la **alternativa manual**: si son pocos documentos, agregar a mano en la consola de Firebase `status` (string) y, si estaban destacados, `featured` (boolean).

## Fase E: administración por claim

- **E.1** En `AuthContext.jsx`, al iniciar sesión, usá `getIdTokenResult(true)` (refresca el token) para tomar claims recién asignados. Actualizá el test de `AuthContext` para ese comportamiento.
- **E.2** Documentá en `docs/PLAN_DESPLIEGUE.md` y `docs/SEGURIDAD.md`: (a) las reglas aceptan hoy al admin por claim **o** por correo verificado (transitorio); la interfaz solo reconoce el claim, por eso el panel no aparece hasta asignarlo; (b) tras asignar el claim hay que cerrar sesión y volver a entrar; (c) cuándo y cómo quitar el respaldo por correo de las reglas.

## Fase F: correcciones menores

- **F.1** Borrá `src/services/moderation.js` (vacío) y los `vi.mock("../../src/services/moderation.js", ...)` de `tests/unit/ListingCard.test.jsx` y `ListingGrid.test.jsx`; si hace falta, mockeá `../../src/services/sellers.js` con `setSellerVerification`.
- **F.2** `WantedSection.handleApproval`: agregá `try/catch` con `console.error` y un mensaje por `onAnnouncement` ("No se pudo actualizar la búsqueda.") igual que el resto de acciones.
- **F.3** "Denunciar" sin sesión: pasá `onLoginRequest` desde `ListingGrid` a `ListingCard`; si no hay `uid`, mostrá el mismo aviso que el formulario de publicar ("Primero ingresá o creá tu cuenta (botón Ingresar, arriba).") y abrí el panel de cuenta, sin llamar a `createReport`. Agregá un test.
- **F.4** Accesibilidad: hoy el conteo de productos se anuncia varias veces (encabezado `.cnt` con `aria-live`, párrafo `sr-only` con `aria-live` en `ListingGrid`, y `LoadingMessage`). Dejá **un solo** anuncio del conteo (el del encabezado) y mantené `LoadingMessage` para carga/errores. Actualizá los tests. **Punto de control humano:** la persona lo prueba con lector de pantalla.
- **F.5** `.gitignore`: agregá `test-results/`, `playwright-report/`, `.env.*.local`. Confirmá con `git status` que no quedan `.env.local` ni `*.log` rastreados.
- **F.6** `.github/workflows/ci.yml`: evitá la ejecución doble (`on: pull_request` más `push` solo a `main`).
- **F.7** `playwright.config.js`: el primer `webServer` espera solo el puerto de Auth (9099). Cambialo para esperar a Firestore (`url: "http://127.0.0.1:8080"`), que es el último en levantar; verificá que el emulador responda 200 ahí y, si no, usá un `globalSetup` que haga polling de ambos.

## Fase G: pruebas de punta a punta nuevas

Agregá a `tests/e2e/app.spec.js`:
1. Un visitante anónimo **no** ve una publicación `En revisión` de otra persona.
2. Una persona con sesión sí ve la suya `En revisión`.
3. El admin borra o oculta una publicación y **desaparece de la pantalla sin recargar** (cubre el bug del mapa que no eliminaba).

## Fase H: documentación y cierre

- **H.1** Actualizá `README.md`, `LEEME-guia.txt` y `docs/` con todo lo anterior (reglas únicas, sin índices compuestos, `.dockerignore`, scripts y flags de producción).
- **H.2** Completá `MIGRATION_LOG.md`: qué se hizo, qué comandos se ejecutaron con su resultado y cuáles no se pudieron ejecutar.
- **H.3** Abrí un pull request con el resumen por fase y la lista de puntos de control humano.

## Puntos de control humano (frená y esperá)

1. Antes de cualquier `firebase deploy` o publicación de reglas.
2. Antes de ejecutar cualquier script con `--apply`, y siempre sobre producción.
3. Después de la Fase F.4: prueba con lector de pantalla.
4. Antes de asignar claims de admin en producción.

## Definición de terminado

- [ ] `.dockerignore` con el nombre correcto y build de Docker verificado (o anotado por qué no).
- [ ] Ninguna consulta filtrada usa `orderBy`; no hace falta `firestore.indexes.json`.
- [ ] Lo borrado u ocultado desaparece de pantalla sin recargar (test unitario y E2E).
- [ ] Existe un solo archivo de reglas y los tests y emuladores lo usan.
- [ ] Los tests de reglas cubren consultas reales, admin por claim y por correo, `wanted` y opiniones.
- [ ] `migrate-status` solo completa lo que falta y es idempotente, con tests.
- [ ] Los scripts permiten producción solo con confirmación explícita.
- [ ] `moderation.js` y los mocks muertos eliminados; los errores menores de la Fase F corregidos.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan; el resto de comandos están ejecutados o su limitación está anotada con honestidad.
