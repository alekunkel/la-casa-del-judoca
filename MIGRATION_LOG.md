# Registro de migración

## Preparación y fase 0

- Se creó `migracion-react` desde `main`; `v0-legacy` apunta al commit original
  `26c067710059ad6a2df8dc1ad21c79f56a1cec3d`.
- La línea base compiló correctamente con Vite. No se ejecutaron pruebas.
- Se agregaron `.gitignore`, la lista manual, README, ESLint y Prettier; las
  carpetas `node_modules/` y `dist/` ya no están versionadas.
- Las eliminaciones ya estaban preparadas en el índice al crear el primer
  commit de higiene, por eso quedaron en el mismo commit que `.gitignore`.
- Los flujos manuales quedan pendientes.

## Fase 1: Firebase

- Se eligió Firebase JS SDK `10.12.2`, coincidente con la versión que se
  cargaba desde CDN.
- La configuración existente se trasladó a `.env.local` (ignorado por Git).
  `.env.example` contiene valores ilustrativos, no credenciales.
- Se agregaron `src/lib/firebase.js` y `src/config.js`. El adaptador temporal
  mantuvo la compatibilidad con el código legacy durante la transición.
- `window.claude`, las promesas globales y la recarga de página al cambiar la
  sesión se quitaron; el estado temporal de legacy recibía actualizaciones
  mediante una suscripción.
- Los mensajes de autenticación se centralizaron en
  `src/utils/authMessages.js`. Lint y compilación pasaron.
- No se ejecutaron pruebas ni flujos manuales.

## Fase 2: servicios y estado reutilizable

- Se agregaron servicios de Firestore para publicaciones, búsquedas,
  moderación/vendedores, opiniones y denuncias, manteniendo las colecciones y
  los identificadores actuales.
- Se creó `AuthContext` con estado de sesión y acciones de autenticación.
- Se agregaron `useCollection`, `useFavorites`, `useA11yPrefs`,
  `shrinkImage` y la conversión limitada a data URL.
- No se ejecutaron pruebas. Lint y compilación pasaron.

## Fase 3: estructura React

- `App` pasó a envolver la vista temporal en `AuthProvider`.
- Durante la transición, `LegacySection` aisló el HTML y la inicialización de
  legacy con limpieza al desmontarse.
- La conversión de valores del selector existente se mantuvo hasta retirar
  `page.html`.

## Fase 4: migración de la interfaz

- Se migraron layout e información estática, accesibilidad, autenticación,
  publicaciones, búsquedas, opiniones, moderación y denuncias a React.
- Se preservaron colecciones, campos, categorías, estados, reglas de
  visibilidad, preferencias locales, textos principales, nombres accesibles y
  manejo del foco.
- Se eliminaron `src/legacy.js`, `src/page.html`, `LegacySection`, el adaptador
  temporal y `html-react-parser`. No quedan referencias a `window.claude`,
  `__fb`, HTML legacy ni manipulación de nodos desde componentes.
- La raíz de React en `src/main.jsx` conserva el único `getElementById`
  necesario para montar React.
- No se ejecutaron pruebas ni flujos manuales. La revisión con lector de
  pantalla queda pendiente.

## Fase 5: accesibilidad

- Se agregó `docs/ACCESIBILIDAD.md` con un guion manual para NVDA/VoiceOver.
- Por inspección, los campos tienen etiquetas o nombres accesibles; se
  conservaron regiones de estado, estados expandidos/seleccionados, texto
  alternativo y el enlace para saltar al contenido. `index.html` conserva
  `lang="es"` y la aplicación tiene un H1.
- El lint de JSX incluye las reglas recomendadas de `eslint-plugin-jsx-a11y`.
- La validación manual con tecnologías de asistencia no se realizó.

## Fase 6: seguridad y datos

- Se prepararon `.firebaserc` con alias de desarrollo placeholder,
  `firebase.json`, reglas v2 candidatas y reglas de Storage de desarrollo.
- Se escribieron tests de reglas y scripts de migración/claims con dry-run,
  proyecto explícito y bloqueo del id de producción.
- Se documentó el plan de fotos y la revisión de seguridad/privacidad.
- No se ejecutaron los tests de reglas ni scripts, ni se escribió en Firebase.
  La configuración y las reglas no se verificaron en emulador por pedido de no
  hacer pruebas; requieren revisión antes de cualquier uso.

## Fase 7: pruebas y CI

- Se agregaron tests unitarios con Vitest y Testing Library para tarjeta,
  filtros, hooks de favoritos/accesibilidad, imágenes y autenticación.
- Se agregaron tests de reglas para Firestore y cuatro flujos Playwright con
  emuladores locales; se configuraron scripts separados para ejecutarlos.
- Se agregó `.github/workflows/ci.yml` para ejecutar `npm ci`, lint, tests
  unitarios y build en push y pull request.
- Por pedido explícito, no se ejecutaron tests unitarios, de reglas ni E2E;
  tampoco se iniciaron emuladores. CI no tiene resultados aún.

## Fase 8: cierre

- Se actualizaron `README.md` y `LEEME-guia.txt` con variables de entorno,
  comandos y el uso de emuladores; la guía mantiene separados los pasos de
  desarrollo y producción.
- El modo de desarrollo se conecta automáticamente a Auth y Firestore
  emulados, con el id local `casa-del-judoca-dev`. La compilación de producción
  conserva el id configurado por entorno.
- Para reducir el chunk de entrada, se separaron los paquetes de React y
  Firebase, y el panel de administración se carga de forma diferida con
  `React.lazy`; el build de cierre pasó y todos los chunks quedaron por debajo
  de 500 kB (el mayor es `firebase-firestore`, 229,82 kB sin gzip).
- `npm run lint` y `npm run build` pasaron después del formateo. No se ejecutó
  ningún comando de pruebas.
- La validación manual con NVDA/VoiceOver y la verificación de reglas en
  emulador siguen pendientes.
- No se desplegó, no se publicaron reglas, no se crearon proyectos y no se
  escribieron datos en Firebase.
- Pendiente: crear y publicar el pull request hacia `main`.
