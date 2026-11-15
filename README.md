# La Casa del Judoka

Sitio comunitario para publicar y encontrar indumentaria de judo nueva y usada.
La aplicación está hecha con React 18 y Vite; Firebase proporciona autenticación
y almacenamiento de datos.

## Requisitos

- Node.js 22 LTS y npm.
- Variables de entorno de Firebase en `.env.local` (ver `.env.example`).

## Desarrollo

```sh
npm install
npm run emulators
npm run dev
```

En desarrollo, la app se conecta automáticamente a los emuladores Auth y
Firestore en `127.0.0.1`, con el proyecto local `casa-del-judoca-dev`. No hace
falta configurar credenciales reales para desarrollar; la carpeta local usa
`firebase.dev.json` y las reglas de emulación.

Para generar la versión de producción, configurá las seis variables
`VITE_FIREBASE_*` de `.env.example` en el entorno de compilación y ejecutá
`npm run build`. El resultado queda en `dist/`.

## Administradores

La autorización de administración ya no depende de una lista de correos en
`src/config.js`. Los permisos se resuelven desde el custom claim `admin` del
usuario autenticado. Para asignarlos en un entorno real, se usa
`scripts/set-admin-claims.mjs` y luego cada cuenta debe cerrar sesión y volver a
ingresar.

## Validaciones

```sh
npm run lint
npm test
npm run build
npm run test:rules
npm run test:e2e
```

`npm run emulators` inicia Auth y Firestore locales, que son los emuladores que
usa la aplicación. No ejecutes scripts de datos con `--apply` ni despliegues sin
revisar el proyecto y recibir aprobación.

## Estructura

- `src/components/`: interfaz React.
- `src/context/`, `src/hooks/`: autenticación y estado de interfaz.
- `src/services/`: operaciones de Firestore.
- `src/lib/`: inicialización del SDK Firebase.
- `docs/`: revisión manual, accesibilidad, seguridad y fotos.
- `firestore.rules`: fuente única de verdad para la app y para el emulador.
  No se usa una segunda versión en producción ni en la validación local.
- [LEEME-guia.txt](LEEME-guia.txt): guía de publicación para personas no técnicas.

La configuración local se guarda en variables `VITE_FIREBASE_*`. No agregues
archivos `.env.local` al repositorio. Antes de publicar, seguí la guía y pedí
una revisión humana de reglas, dominios y privacidad.
