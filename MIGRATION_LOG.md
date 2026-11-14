# Registro de migración

## Preparación y fase 0

- Se creó `migracion-react` desde `main` y el tag de respaldo `v0-legacy`
  apunta al commit original `26c067710059ad6a2df8dc1ad21c79f56a1cec3d`.
- La línea base compiló correctamente con Vite. No se ejecutaron pruebas.
- Se agregaron `.gitignore`, la lista de comprobación manual, documentación
  inicial del proyecto, ESLint y Prettier; `node_modules/` y `dist/` ya no
  están versionados.
- Las eliminaciones ya estaban preparadas en el índice al crear el primer
  commit de higiene, por eso quedaron en el mismo commit que `.gitignore`.
- La verificación manual de los flujos y con lector de pantalla queda pendiente.

## Fase 1: Firebase

- Se eligió Firebase JS SDK `10.12.2`, coincidente con la versión que se
  cargaba desde CDN.
- La configuración existente se trasladó a `.env.local`, que está ignorado.
  `.env.example` contiene solo nombres de variables y valores ilustrativos.
- Se agregaron `src/lib/firebase.js` y `src/config.js`. El adaptador temporal
  conserva los servicios requeridos por el código legacy.
- `initializeLegacy(services)` recibe esos servicios directamente. El puente
  `window.claude`, las promesas globales y la recarga de página al cambiar la
  sesión se quitaron; el estado de usuario se actualiza mediante una
  suscripción explícita.
- La compilación y el lint pasaron. No se ejecutaron pruebas ni flujos manuales.
- Los mensajes de autenticación ya están centralizados en
  `src/utils/authMessages.js`.
- Pendiente: validar los flujos manualmente en el emulador.

## Fase 2: servicios y estado reutilizable

- Se agregaron servicios de Firestore para publicaciones, búsquedas,
  moderación/vendedores, opiniones y denuncias, manteniendo las colecciones
  y los identificadores actuales.
- Se creó `AuthContext` con estado de sesión y acciones de autenticación.
- Se agregaron `useCollection`, `useFavorites`, `useA11yPrefs`,
  `shrinkImage` y la conversión limitada a data URL.
- No se ejecutaron pruebas. Lint y compilación pasaron.
- La interfaz todavía consume temporalmente el adaptador legacy.

## Fase 3: estructura React

- `App` ahora envuelve la vista en `AuthProvider`.
- La carga temporal de `page.html` y la inicialización de legacy quedaron
  aisladas en `LegacySection`, con limpieza de suscripciones al desmontarse.
- La conversión de valores del selector existente se conserva durante la
  transición.
- No se ejecutaron pruebas. Lint y compilación pasaron.
