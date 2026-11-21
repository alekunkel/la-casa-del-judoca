# Instrucciones para el agente: adaptar la app al modelo `status` y a las reglas v2

> Copiar a la raíz del repo como `MIGRATION_STATUS.md`. Continúa el trabajo de `INSTRUCCIONES_AGENTE_MIGRACION.md`; las reglas de oro de ese documento siguen vigentes (un paso, un commit; accesibilidad primero; no tocar producción; no inventar).
## 0. Objetivo

La migración a React está terminada, pero **la interfaz y las reglas candidatas `firestore.rules.v2` son incompatibles**. Tu tarea es adaptar el código para que funcione con las reglas v2, probarlo en emuladores y dejar documentado el plan de despliegue. **No despliegues nada.**

## 1. Diagnóstico verificado (leelo en el código antes de empezar)
La interfaz hoy decide qué es "aprobado" y "destacado" con la colección `mod`, mientras que las reglas v2 lo hacen con campos dentro de cada documento:

| Tema | Interfaz actual | Reglas v2 |
|---|---|---|
| Aprobación de publicaciones | `mod/{id}.approved` (`setModeration`) | `listings.status` (`pending` o `approved`) |
| Destacado | `mod/{id}.featured` | `listings.featured` (booleano, solo admin) |
| Crear publicación | Sin campo `status` (`ListingForm.jsx`) | Exige `status == 'pending'` y `hasAll([... 'status'])` |
| Leer publicaciones | `onSnapshot` de **toda** la colección (`subscribeListings`) | Solo `approved`, las propias o todas si `admin` |
| Administrador | Lista `ADMIN_EMAILS` + `emailVerified` (`AuthContext.jsx`) | Custom claim `request.auth.token.admin == true` |
| "Se busca" | Aprobación también vía `mod` (`WantedSection.jsx`) | `validWanted` no admite `status` |

Consecuencias si se publicaran las v2 sin cambios: nadie puede publicar (el documento no valida) y, para quien no es admin, la consulta de toda la colección falla entera (Firestore no filtra por reglas).

Otros hechos útiles:
- `firebase.json` apunta a `firestore.rules` (las reglas **actuales de producción**). Por eso hoy los tests E2E corren contra las reglas viejas y los tests de reglas leen `firestore.rules.v2` directamente: ambos pueden dar verde y aun así la combinación nueva estar rota.
- El E2E ya crea el admin con claim `admin: true` y correo verificado.
- `scripts/migrate-status.mjs` solo calcula `status` de `listings`; no copia `featured` ni toca `wanted`.
- Hay 17 archivos "modificados" sin commitear que parecen diferencias de saltos de línea.

## 2. Decisiones de diseño (ya tomadas; no las cambies sin preguntar)

1. **Una sola fuente de verdad:** `status` y `featured` viven en el propio documento de `listings`. `wanted` también pasa a tener `status`. La colección `mod` deja de leerse y escribirse desde la interfaz. En las reglas queda **solo como compatibilidad temporal** (lectura pública, escritura admin) con un comentario `// ELIMINAR tras verificar la migración`.
2. **Admin por custom claim.** El cliente lee `claims.admin === true` del token. Se elimina `ADMIN_EMAILS` del código cliente.
3. **Consultas compatibles con las reglas, sin índices compuestos:**
   - Anónimo: `where("status", "==", "approved")`.
   - Con sesión (no admin): dos listeners, `where("status", "==", "approved")` y `where("owner", "==", uid)`, combinados sin duplicados por `id`.
   - Admin: toda la colección.
   - El orden por `ts` descendente se hace **en el cliente**, para no necesitar índices compuestos.
4. **Crear como admin:** las reglas permiten `status == 'pending'` para cualquiera y `status == 'approved'` solo si es admin. Así el admin publica en una sola escritura.
5. **Emuladores con reglas nuevas, producción intacta:** se crea `firebase.dev.json` (copia de `firebase.json` pero con `"rules": "firestore.rules.v2"`). Los scripts de emulador y Playwright usan `--config firebase.dev.json`. `firebase.json` y `firestore.rules` **no se tocan**; el renombrado v2 → `firestore.rules` lo hace una persona en el despliegue.

## 3. Tareas

Rama nueva: `status-model`, creada desde `migracion-react`.

### Fase A: base limpia

- **A.1** Ejecutá `git status` y `git diff --ignore-cr-at-eol --stat`. Si las diferencias son solo de saltos de línea o espacios, agregá `.gitattributes` (`* text=auto eol=lf`), normalizá y commiteá aparte (`chore: normalizar saltos de línea`). Si hay cambios de contenido reales, **detenete y listalos**.
- **A.2** Ejecutá `npm install`, `npm run lint`, `npm test` y `npm run build`. Anotá los resultados reales en `MIGRATION_LOG.md`. Si algo no se puede ejecutar en tu entorno (falta Java, navegador, red), escribilo tal cual; **no lo marques como pasado**.

### Fase B: administración por claims

- **B.1** En `AuthContext.jsx`, calculá `isAdmin` a partir de `(await user.getIdTokenResult()).claims.admin === true`. `loading` sigue en `true` hasta que el claim se resolvió. Si el token cambia (login/logout), recalcular. Quitá `ADMIN_EMAILS` de `config.js` y de los imports.
- **B.2** Actualizá `tests/unit/AuthContext.test.jsx` (los mocks deben devolver `getIdTokenResult`). Agregá casos: claim presente, claim ausente, correo "de admin" **sin** claim (no debe ser admin).

### Fase C: capa de datos con `status`

- **C.1** `services/listings.js`: `createListing` sigue igual; agregá `setListingStatus(id, status)`, `setListingFeatured(id, featured)` (ambas con `updateDoc`) y `subscribeVisibleListings({ uid, isAdmin }, onData, onError)` con la lógica del punto 3 de las decisiones. Debe devolver una única función para cancelar todos los listeners y ordenar por `ts` descendente en el cliente.
- **C.2** `services/wanted.js`: lo mismo para `wanted` (`setWantedStatus`, `subscribeVisibleWanted`).
- **C.3** `App.jsx`: reemplazá la suscripción a `mod` por las nuevas, dependiendo de `[uid, isAdmin]`, y no te suscribas hasta que `loading` sea `false`. Eliminá la prop `moderation` de toda la cadena de componentes. `availableCount` pasa a usar `listing.status === "approved"`.

### Fase D: componentes

Cambiá cada uso de `moderation[id]` por los campos del documento:

- **D.1** `ListingForm.jsx`: agregá `status: isAdmin ? "approved" : "pending"` y `featured: false` al crear; eliminá la llamada a `setModeration`. Revisá que **las claves del objeto coincidan exactamente** con el `hasAll`/`hasOnly` de `validListing` (hoy: `title, seller, size, alt, pay, ship, city, cat, sold, cond, price, wa, photo, photos, owner, ts` + `status` y `featured`).
- **D.2** `ListingCard.jsx`, `ListingGrid.jsx`, `AdminPanel.jsx`: usá `listing.status` y `listing.featured`; las acciones de aprobar/quitar/destacar llaman a `setListingStatus`/`setListingFeatured`. La denuncia que oculta una publicación (`setModeration(report.listing, { approved: false })`) pasa a `setListingStatus(report.listing, "pending")`.
- **D.3** `WantedSection.jsx`: lo mismo con `wanted.status`; crear con `status` según sea admin o no.
- **D.4** Mantené **idénticos** los textos, etiquetas (`En revisión`, `Destacado`), roles ARIA, mensajes de estado y manejo del foco. Si un cambio afecta algo de accesibilidad, detenete.
- **D.5** Verificá con `grep -rn "moderation\|setModeration\|ADMIN_EMAILS" src` que no queden usos (salvo `sellers`, que se mantiene tal cual). Podés borrar `subscribeModeration` y `setModeration` de `services/moderation.js`, dejando solo lo de vendedores.

### Fase E: reglas v2

- **E.1** `firestore.rules.v2`: 
  - `listings` create: `status == 'pending'` **o** (`isAdmin()` y `status == 'approved'`).
  - `wanted`: agregá `status` a `validWanted` (`hasAll`/`hasOnly`, valores `pending|approved`), lectura igual que `listings` (aprobada, propia o admin), crear `pending` (o `approved` si es admin), update solo admin, borrar admin o dueño.
  - Dejá `mod` con el comentario de eliminación futura.
  - No cambies nada más sin dejar el motivo en el log.
- **E.2** Mantené `firestore.rules` **sin modificar**.

### Fase F: scripts de datos

- **F.1** `scripts/migrate-status.mjs`: además de `status`, copiá `featured` desde `mod` a cada `listings` (solo si es `true`, para no inflar documentos) y repetí `status` para `wanted`. El resumen del dry-run debe separar por colección y mostrar cuántos documentos cambiarían. Debe ser **idempotente**: una segunda ejecución con `--apply` debe dar 0 cambios.
- **F.2** Mantené las protecciones actuales (dry-run por defecto, `--project` obligatorio, bloqueo del id de producción).

### Fase G: configuración de emuladores

- **G.1** Creá `firebase.dev.json` según la decisión 5 y actualizá los scripts de `package.json` (`emulators`, `test:rules`) y `playwright.config.js` (`webServer`) para usar `--config firebase.dev.json`.
- **G.2** Agregá el script `"test:all": "npm run lint && npm test && npm run test:rules && npm run test:e2e"` y `"verify": "npm run test:all && npm run build"`.

### Fase H: tests

- **H.1** Unit: actualizá `ListingCard.test.jsx` y `ListingGrid.test.jsx` (ya no existe la prop `moderation`; el estado viene de `status`/`featured`). Agregá un test para `subscribeVisibleListings` con Firestore mockeado que cubra los tres casos (anónimo, usuario, admin) y la eliminación de duplicados.
- **H.2** Reglas (`tests/rules/firestore.rules.test.js`): agregá casos para
  - anónimo **puede** consultar con `where status == approved` y **no puede** leer la colección completa;
  - usuario puede consultar con `where owner == uid` y no ve `pending` ajenos;
  - usuario no puede crear con `status: "approved"`; admin sí;
  - owner no puede cambiar `status` ni `featured`; admin sí;
  - `wanted` con las mismas reglas de visibilidad.
- **H.3** E2E: mantené los 4 flujos y agregá (a) un visitante anónimo no ve una publicación `En revisión` ajena, (b) el admin destaca una publicación y aparece `Destacado`.
- **H.4** **Ejecutá todo lo que tu entorno permita** (`npm run lint`, `npm test`, `npm run build`, `npm run test:rules`, `npm run test:e2e`). Para cada comando, dejá en el log: comando, resultado real y, si no pudiste correrlo, el motivo exacto. **Nunca escribas "pasó" sin haberlo ejecutado.**

### Fase I: documentación

- **I.1** Actualizá `README.md`, `LEEME-guia.txt`, `docs/SEGURIDAD.md` y `docs/CHECKLIST_MANUAL.md` (ya no hay lista de correos admin en el código; los administradores se definen con el script de claims).
- **I.2** Escribí `docs/PLAN_DESPLIEGUE.md` para una **persona** (lenguaje claro, con comandos), con este orden y sus verificaciones:
  1. Crear el proyecto de desarrollo y probar todo allí primero.
  2. Asignar el claim `admin` a las dos cuentas administradoras con `scripts/set-admin-claims.mjs`. Pedirles que cierren sesión y vuelvan a entrar.
  3. Ejecutar `migrate-status.mjs` en `--dry-run` sobre producción-copia; revisar; luego `--apply`.
  4. Desplegar **primero la interfaz** (compatible con las reglas viejas y con las nuevas) y verificar el funcionamiento.
  5. Re-ejecutar el dry-run: debe dar **0 cambios** (si no, alguien aprobó con la interfaz vieja durante la ventana; aplicar de nuevo).
  6. Reemplazar `firestore.rules` por `firestore.rules.v2` y desplegar las reglas.
  7. Verificar con el checklist manual y con una cuenta de prueba.
  8. Más adelante: retirar `mod` de las reglas.
  - Incluir cómo volver atrás (tag `v0-legacy`, reglas anteriores guardadas).
- **I.3** Completá `MIGRATION_LOG.md` con lo hecho, lo no ejecutado y los riesgos.

## 4. Puntos de control humano (frená y esperá)

1. Después de A.1 si hay cambios de contenido reales sin commitear.
2. Después de la Fase D: una persona prueba a mano el listado, publicar, aprobar y destacar (idealmente con lector de pantalla).
3. Antes de cualquier `firebase deploy`, `--apply` de scripts o cambio en producción. **Nunca lo hagas vos.**

## 5. Definición de terminado

- [ ] No quedan usos de `moderation`/`setModeration` ni `ADMIN_EMAILS` en `src/`.
- [ ] Publicar, ver, aprobar y destacar funcionan contra las **reglas v2 en emulador** (E2E con `firebase.dev.json`).
- [ ] Los tests de reglas cubren consultas filtradas, creación, edición y `wanted`.
- [ ] `firebase.json` y `firestore.rules` no cambiaron.
- [ ] El script de migración es idempotente y cubre `featured` y `wanted`.
- [ ] `docs/PLAN_DESPLIEGUE.md` está escrito.
- [ ] El log indica con honestidad qué comandos se ejecutaron y cuáles no.
