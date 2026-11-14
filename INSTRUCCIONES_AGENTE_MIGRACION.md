# Instrucciones para el agente: migración de "La Casa del Judoka" a React real

> Destino sugerido: copiar este archivo a la raíz del repo como `MIGRATION.md` (o `AGENTS.md`) y pedirle al agente que lo siga de principio a fin.

## 0. Rol y objetivo

Sos un agente de ingeniería de software. Tu tarea es migrar este proyecto, que hoy es HTML estático parseado más lógica en JavaScript "vanilla" con manipulación directa del DOM, a una aplicación **React 18 + Vite** con componentes reales, Firebase como dependencia npm y una capa de datos separada.

La página **ya funciona en producción**. El criterio número uno es **no romper nada**. El criterio número dos es **no empeorar la accesibilidad**: la persona dueña del proyecto usa lector de pantalla.

Idioma: todo texto visible para usuarios, mensajes de commit, comentarios y documentación van **en español rioplatense**. Los nombres de variables y funciones nuevas van en inglés.

## 1. Reglas de oro (no negociables)

1. **Un paso, un commit.** Cada tarea numerada termina con `npm run build` exitoso y un commit propio. Formato: `fase X.Y: descripción corta`.
2. **No mezclar React y DOM manual sobre el mismo nodo.** Mientras `legacy.js` siga existiendo, cada sección se migra entera: se crea el componente, se borra su HTML de `src/page.html` y su código de `src/legacy.js` en el mismo commit.
3. **Accesibilidad primero.** Conservar `aria-live`, `aria-expanded`, `aria-pressed`, `aria-labelledby`, `role`, el manejo del foco y el texto alternativo de fotos. Si un cambio puede perder alguno, detenete y avisá.
4. **No tocar producción.** Prohibido ejecutar `firebase deploy`, publicar reglas, escribir en la base real o correr scripts de datos contra el proyecto `casa-del-judoca`. Todo eso es trabajo humano (ver "Puntos de control humano").
5. **No inventar.** Si algo no está claro en el código, leelo antes de asumir. Si sigue sin estar claro, anotalo en `MIGRATION_LOG.md` y seguí con lo que sí está claro.
6. **No borrar funcionalidad.** Si una función de `legacy.js` no tiene equivalente en el diseño nuevo, preguntá antes de eliminarla.
7. **Cambios mínimos de estilo.** No rediseñar. `src/styles.css` se conserva tal cual; solo se ajusta si un componente lo exige.
8. **Secretos.** No imprimas ni commitees claves privadas. La `apiKey` web de Firebase no es secreta, pero igual va a variables de entorno (Fase 1).

## 2. Estado actual verificado del repo

```
index.html            # Entrada de Vite (<div id="root">)
package.json          # react 18, react-dom, html-react-parser | vite 6, @vitejs/plugin-react
vite.config.js
firestore.rules
LEEME-guia.txt        # guía de despliegue para humanos (conservar)
README.md             # casi vacío
dist/                 # build versionado por error
src/
  main.jsx            # createRoot(...).render(<App />)
  App.jsx             # parsea page.html con html-react-parser y en useEffect llama a
                      # initializeFirebase() e initializeLegacy()
  page.html           # TODO el markup (~272 líneas)
  styles.css          # ~711 líneas
  firebase.js         # config FB + carga del SDK 10.12.2 desde CDN gstatic (import dinámico),
                      # auth (registro/login/reset/verificación), y puente window.claude.use(...)
  legacy.js           # ~206 líneas densas; toda la lógica de la app
```

Problemas conocidos:
- `node_modules/` (~2.800 archivos) y `dist/` están versionados y no hay `.gitignore`.
- El SDK de Firebase no está en `package.json`; se carga por CDN en tiempo de ejecución.
- `window.claude`, `window.__fbReady` y `window.__fbResolve` son restos de una versión anterior (artifact de Claude) y deben desaparecer.
- `onAuthStateChanged` hace `location.reload()` en cada cambio de sesión después del primero.
- Las fotos se guardan como data-URL base64 (límite de 230.000 caracteres por foto, máx. 4) dentro de Firestore.
- `ADMIN_EMAILS` está duplicado en `src/firebase.js` y `firestore.rules`.

Colecciones de Firestore: `listings`, `wanted`, `mod`, `sellers`, `reviews`, `reports`.

Mapa de `src/legacy.js` (verificalo leyendo el archivo; los números de línea son aproximados):
- `CFG` (alias, WhatsApp, Instagram, precio), `payOn`
- Estado global: `MOD, VER, REV, REP, WNT, all, cat, FV (favoritos), canAdmin, uid, db, assets`
- Helpers: `setMod`, `esc`, `shrink` (reduce imágenes a máx. 800 px, JPEG 0,7), `mk`, `mb`, `ratingTxt`, `revPanel`
- Secciones: `wanted()`, `admin()`, `tg` (mostrar/ocultar formulario), `render()` (listado, filtros, tarjetas, favoritos, WhatsApp), `ap()` (preferencias de accesibilidad: clases `big, xl, hc, dk, sp, ul` en `<html>`, guardadas en `localStorage.a11y`)
- Suscripciones en tiempo real al final: `mod`, `reviews`, `wanted`, `reports`, `sellers`, `listings`

`localStorage` usado: `fav` (favoritos) y `a11y` (preferencias). `sessionStorage`: `authmsg`.

## 3. Preparación (hacer antes de la Fase 0)

1. Leé completos: `src/legacy.js`, `src/firebase.js`, `src/page.html`, `firestore.rules`, `LEEME-guia.txt`.
2. Creá `MIGRATION_LOG.md` en la raíz. Ahí vas a registrar, por cada tarea: qué hiciste, qué decidiste y qué quedó pendiente o dudoso.
3. Creá la rama `migracion-react` desde la actual. **Todo se hace en esa rama.** Nunca commitees directo en `main`.
4. Ejecutá `npm install` y `npm run build`. Anotá el resultado como línea base. Si el build ya falla, detenete y reportalo.

## 4. Fases y tareas

### Fase 0: Higiene del repo

- **0.1** Crear `.gitignore` con: `node_modules/`, `dist/`, `.env`, `.env.local`, `*.log`, `.DS_Store`.
- **0.2** Sacar del índice lo que no corresponde: `git rm -r --cached node_modules dist`. Verificar con `git ls-files | grep -c node_modules` que dé 0.
- **0.3** Crear el tag de respaldo `v0-legacy` sobre el último commit anterior a tus cambios (`git tag v0-legacy <commit>`).
- **0.4** Escribir `docs/CHECKLIST_MANUAL.md` con los flujos a probar a mano tras cada fase: registro, confirmación de correo, login/logout, recuperar contraseña, publicar con y sin fotos, aprobación por admin, destacar, verificar vendedor, filtros/búsqueda/orden, favoritos, "Se busca", opiniones (crear, borrar como admin), denuncias, panel de accesibilidad (cada opción), enlace de WhatsApp.
- **0.5** Reescribir `README.md`: qué es el proyecto, stack, cómo correrlo (`npm install`, `npm run dev`, `npm run build`), estructura de carpetas, enlace a `LEEME-guia.txt`.
- **0.6** Agregar ESLint (`eslint`, `eslint-plugin-react`, `eslint-plugin-react-hooks`, `eslint-plugin-jsx-a11y`) y Prettier. Scripts: `lint`, `format`. **No** corregir en masa código viejo: solo asegurar que el código nuevo pase el lint (podés excluir `src/legacy.js` y `src/firebase.js` hasta que se eliminen).

**Aceptación:** repo liviano, `npm run build` ok, checklist y README escritos.

### Fase 1: Firebase como dependencia normal

- **1.1** `npm install firebase` (usar la versión 10.x que ya se usa o la última estable compatible; registrar la elección en el log).
- **1.2** Crear `src/lib/firebase.js` que exporte `app`, `auth` y `db` usando imports estáticos de `firebase/app`, `firebase/auth` y `firebase/firestore`.
- **1.3** Mover la config a variables de entorno `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Crear `.env.example` (sin valores reales) y `.env.local` con los valores actuales (ignorado por git).
- **1.4** Crear `src/config.js` con `ADMIN_EMAILS` y `CFG` (precio, alias, link, wa, ig). Valores idénticos a los actuales.
- **1.5** Reescribir `src/firebase.js` para que use `lib/firebase.js` y `config.js`, **manteniendo temporalmente** el objeto de servicios `{db, user, assets}` que consume `legacy.js`, pero sin `window.claude` ni promesas globales (pasarle los servicios a `initializeLegacy(services)` como argumento). Ajustar `legacy.js` y `App.jsx` en consecuencia.
- **1.6** Eliminar el `location.reload()` de `onAuthStateChanged`. Si `legacy.js` depende de ese reload para refrescar estado (`uid`, `canAdmin`), reemplazarlo por una actualización explícita equivalente y documentarlo en el log.

**Aceptación:** sin imports por URL, sin `window.claude`, build ok, checklist completo sin diferencias.

### Fase 2: Capa de datos y estado

Crear, sin cambiar todavía la interfaz:

- **2.1** `src/services/` con una función por operación (sin React): `listings.js` (crear, actualizar, borrar, suscribir), `wanted.js`, `moderation.js` (`mod` + `sellers`), `reviews.js` (id `uid_sellerUid`), `reports.js`. Cada `subscribe*` devuelve la función para desuscribirse. Conservar las mismas rutas y campos que usa `legacy.js` hoy.
- **2.2** `src/context/AuthContext.jsx`: proveedor con `user`, `uid`, `isAdmin` (correo en `ADMIN_EMAILS` **y** `emailVerified`), `loading`, y acciones `signIn`, `signUp` (envía verificación), `resetPassword`, `signOut`. Reutilizar el diccionario de mensajes de error de `firebase.js` en `src/utils/authMessages.js`.
- **2.3** `src/hooks/`: `useCollection(subscribeFn)` con limpieza en `useEffect`; `useFavorites()` (lee/escribe `localStorage.fav` con try/catch); `useA11yPrefs()` (lee/escribe `localStorage.a11y` y aplica las clases `big, xl, hc, dk, sp, ul` sobre `document.documentElement`).
- **2.4** `src/utils/`: `shrinkImage.js` (portar `shrink` tal cual), `photos.js` (conversión a data-URL con el límite de 230.000 caracteres, mismo mensaje de error "foto muy pesada" mostrado de forma amigable).

**Aceptación:** los archivos existen, el lint pasa, la app sigue funcionando igual (los hooks todavía no se usan en pantalla o solo en los componentes ya migrados).

### Fase 3: Esqueleto de componentes

- **3.1** Crear la estructura `src/components/{layout,auth,a11y,listings,wanted,reviews,admin,info}/` y `src/App.jsx` pasa a envolver todo en `<AuthProvider>`.
- **3.2** Mantener durante la transición un componente `<LegacySection html={...} />` que renderice el HTML restante de `page.html` y dispare `initializeLegacy` **una sola vez** y con limpieza, para que no se dupliquen listeners en modo desarrollo (React StrictMode).

### Fase 4: Migración módulo por módulo

Para **cada** módulo: (a) leer el código legacy correspondiente, (b) crear los componentes, (c) borrar el HTML de `page.html` y el código de `legacy.js` de esa sección, (d) correr build + lint, (e) ejecutar mentalmente o por script el checklist de esa sección, (f) commit.

Orden obligatorio:

1. **4.1 Layout e información estática:** `Header` (logo, título, botón de cuenta), `Footer`, `SkipLink` si existe, `HowItWorks` (los 3 pasos), `About` ("Quiénes somos"), `Sponsors` (con enlace a WhatsApp usando `CFG.wa` y el texto actual), `BuyingHelp`, `cfgwarn`. El Instagram de `CFG.ig` se renderiza como enlace con `target="_blank" rel="noopener"` y el texto actual ("se abre en otra pestaña").
2. **4.2 Panel de accesibilidad:** `A11yPanel` usando `useA11yPrefs`. Mismos controles, mismas etiquetas, mismas clases CSS.
3. **4.3 Autenticación:** `AuthPanel` (campos correo/contraseña, botones Ingresar, Crear cuenta, Olvidé mi contraseña, Salir; mensajes en una región `role="status" aria-live="polite"`; el botón de cuenta cambia a "Mi cuenta" y muestra "Ingresaste como …" con el aviso de correo sin confirmar). Al abrir el panel el foco va al correo (o al botón Salir si hay sesión). Mensajes de "Ingresaste correctamente", "Cuenta creada…" y "Saliste de tu cuenta" se anuncian en la región de estado principal (reemplazo de `sessionStorage.authmsg`).
4. **4.4 Listado:** `ListingGrid`, `ListingCard`, `CategoryChips` (incluye "Todo" y "Favoritos" con `aria-pressed`), `Filters` (búsqueda, estado, orden), `LoadingMessage`/región de estado. Reproducir exactamente la lógica de `render()`: visibilidad (`aprobada`, o admin, o dueño), orden (más nuevos, menor/mayor precio), filtrado, favoritos, destacadas, insignia de vendedor verificado, valoración promedio (`ratingTxt`), enlace de WhatsApp, medios de pago y entrega, ciudad.
5. **4.5 Publicar producto:** `ListingForm` (campos y validaciones idénticos: `maxlength`, `required`, opciones de categoría/estado/pago/entrega, `Estado` por defecto "Muy buen estado"), `PhotoUploader` (máx. 4, reducción con `shrinkImage`, campo de descripción para lectores de pantalla). Al enviar: crear en `listings` con `owner = uid`, quedar "en revisión" y anunciar el resultado en la región de estado. Mantener el botón "Publicar mi producto" con `aria-expanded`/`aria-controls` y el foco al título al abrir.
6. **4.6 "Se busca":** `WantedSection`, `WantedForm`, listado, borrado por dueño o admin.
7. **4.7 Opiniones:** `ReviewPanel` (`id = uid_vendedor`, calificación 1 a 5, no sobre uno mismo, borrar solo admin) y `RatingSummary`.
8. **4.8 Admin y denuncias:** `AdminPanel` (aprobar, destacar, verificar vendedor, ver y resolver denuncias), visible solo si `isAdmin`. Mantener `setMod` con el mismo formato de documento `{approved, featured, ...}`.

Al terminar 4.8:
- **4.9** Borrar `src/legacy.js`, `src/page.html`, `LegacySection` y la dependencia `html-react-parser` (`npm uninstall html-react-parser`). Verificar que no queden referencias con `grep -R "legacy\|page.html\|window.claude\|__fb" src`.
- **4.10** Revisar que ningún componente use `document.getElementById`/`querySelector`/`innerHTML`. Si hace falta manejar el foco, usar `useRef`.

**Aceptación:** la app funciona solo con componentes React; el checklist manual completo da igual que en `v0-legacy`; `npm run lint` y `npm run build` pasan sin errores.

### Fase 5: Accesibilidad (verificación transversal)

- **5.1** Correr `eslint-plugin-jsx-a11y` en modo estricto sobre todo `src/` y resolver cada advertencia.
- **5.2** Confirmar por inspección: cada `input`/`select` tiene `label` asociado; los botones tienen nombre accesible; las regiones dinámicas tienen `role="status"` o `aria-live`; hay un único `h1`; la jerarquía de encabezados es coherente; el orden de tabulación coincide con el visual; `lang="es"` está presente.
- **5.3** Agregar `docs/ACCESIBILIDAD.md` con un guion de prueba para NVDA/VoiceOver (lo ejecuta una persona, ver puntos de control humano).

### Fase 6: Seguridad y modelo de datos (solo preparar, no aplicar)

Todo lo de esta fase se **escribe y se prueba en emulador**, pero **no se aplica** a producción.

- **6.1** Crear `firebase.json` y `.firebaserc` con alias `dev` (el id del proyecto de desarrollo se deja como placeholder `casa-del-judoca-dev`) y configuración de emuladores (auth, firestore, storage, hosting).
- **6.2** Proponer `firestore.rules` v2 en un archivo **nuevo** `firestore.rules.v2` (no sobrescribir el actual) con:
  - validación de campos y tipos en `listings` y `wanted` (largo de textos, precio numérico ≥ 0, máx. 4 fotos, `owner == auth.uid`);
  - campo `status` en `listings` (`pending|approved`), lectura pública solo de `approved`, y del dueño o admin para el resto; el dueño no puede cambiar `status` ni `featured`;
  - admin por custom claim (`request.auth.token.admin == true`) en lugar de lista de correos.
- **6.3** Escribir tests de reglas con `@firebase/rules-unit-testing` en `tests/rules/` cubriendo: lectura pública, creación válida e inválida, edición por dueño, intento de autoaprobación, acceso de admin, reseñas (una por comprador/vendedor, no sobre uno mismo, rango 1 a 5), denuncias (solo admin lee).
- **6.4** Escribir `scripts/migrate-status.mjs`: lee `mod`, agrega `status` a cada `listings`. Debe tener modo **`--dry-run` por defecto** que solo imprime lo que haría, y exigir `--apply` y un id de proyecto explícito para escribir.
- **6.5** Escribir `scripts/set-admin-claims.mjs` (usa Admin SDK y una credencial local indicada por variable de entorno; nunca incluir credenciales en el repo).
- **6.6** Escribir `docs/PLAN_FOTOS_STORAGE.md`: diseño para pasar las fotos de base64 a Firebase Storage (ruta `listings/{uid}/{id}/{n}.jpg`, reglas de Storage, límites de tamaño, script de migración de las existentes). Dejar claro que puede requerir un plan de pago y que hay que verificar las condiciones vigentes.
- **6.7** Documentar en `docs/SEGURIDAD.md`: restringir la `apiKey` por dominio en Google Cloud, activar App Check, política de privacidad (Ley 25.326, orientación, no asesoramiento legal).

### Fase 7: Tests y CI

- **7.1** Vitest + `@testing-library/react` + `jsdom`. Tests mínimos: `ListingCard`, `Filters` (orden y filtro), `useFavorites`, `useA11yPrefs`, `shrinkImage` (con mocks), `AuthContext` (con servicios mockeados).
- **7.2** Playwright con el emulador de Firebase para 4 flujos: registrarse y ver el aviso de verificación, publicar y ver "en revisión", aprobar como admin y verlo público, dejar una opinión.
- **7.3** `.github/workflows/ci.yml`: en cada push y pull request ejecutar `npm ci`, `npm run lint`, `npm test`, `npm run build`.

### Fase 8: Cierre

- **8.1** Actualizar `LEEME-guia.txt` y `README.md` con lo que cambió (variables de entorno, emuladores, nuevos scripts). La guía debe seguir siendo comprensible para una persona no técnica.
- **8.2** Revisar el tamaño del bundle (`npm run build`) y aplicar `React.lazy` solo si hay un chunk grande evidente.
- **8.3** Completar `MIGRATION_LOG.md` con un resumen final: qué se hizo, qué quedó pendiente, riesgos.
- **8.4** Abrir un pull request de `migracion-react` hacia `main` con la descripción: resumen por fase, capturas si aplica, y la lista de puntos de control humano abajo.

## 5. Puntos de control humano (el agente se detiene y espera confirmación)

El agente **no continúa** más allá de estos puntos sin una confirmación explícita:

1. Después de la Fase 0: confirmar que el `.gitignore` y el borrado de `node_modules`/`dist` del índice están bien.
2. Después de **cada** módulo de la Fase 4: una persona prueba con el checklist y, para los módulos 4.2, 4.3, 4.4, 4.5, **con lector de pantalla** (NVDA/VoiceOver).
3. Antes de aplicar cualquier regla de Firestore o Storage a producción.
4. Antes de correr cualquier script de datos con `--apply`.
5. Antes de crear un proyecto Firebase de desarrollo, activar un plan de pago o cambiar la configuración de Authentication (dominios autorizados).
6. Antes del despliegue final.

## 6. Si algo sale mal

- Si un build o test falla y no lo resolvés en **3 intentos razonables**, revertí tu último cambio (`git revert`/`git restore`), anotá en `MIGRATION_LOG.md` el error exacto y lo que probaste, y pedí ayuda. No acumules cambios sobre una base rota.
- Si descubrís una diferencia de comportamiento entre la versión vieja y la nueva, **la versión vieja manda**, salvo que sea un bug evidente: en ese caso, documentalo y preguntá.
- Rollback total: `git checkout v0-legacy`.

## 7. Definición de terminado

- [ ] No existen `src/legacy.js`, `src/page.html` ni `window.claude`.
- [ ] Firebase se importa desde `node_modules` y la config sale de variables de entorno.
- [ ] Todo el estado vive en React (contexto + hooks) y los datos pasan por `src/services/`.
- [ ] El checklist manual completo da igual que en `v0-legacy`.
- [ ] `npm run lint`, `npm test` y `npm run build` pasan; la CI está en verde.
- [ ] Las reglas v2, sus tests y los scripts de migración están escritos y probados en emulador, **sin haberse aplicado a producción**.
- [ ] Documentación al día (`README.md`, `LEEME-guia.txt`, `docs/`, `MIGRATION_LOG.md`).
- [ ] La persona responsable aprobó la prueba con lector de pantalla.
