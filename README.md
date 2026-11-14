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
npm run dev
```

En desarrollo, la app se conecta automáticamente a los emuladores Auth y
Firestore en `127.0.0.1`, con el proyecto local `casa-del-judoca-dev`. Iniciá
`npm run emulators` en una terminal y `npm run dev` en otra. No hace falta
configurar credenciales reales para desarrollar.

Para generar la versión de producción, configurá las seis variables
`VITE_FIREBASE_*` de `.env.example` en el entorno de compilación y ejecutá
`npm run build`. El resultado queda en `dist/`.

## Validaciones

```sh
npm run lint
npm test
npm run build
```

Las pruebas de reglas y de navegador usan únicamente los emuladores locales:

```sh
npm run test:rules
npm run test:e2e
```

`npm run emulators` inicia Auth y Firestore locales, que son los emuladores que
usa la aplicación. No ejecutes scripts de datos con `--apply` sin revisar el
proyecto y recibir aprobación.

## Estructura

- `src/components/`: interfaz React.
- `src/context/`, `src/hooks/`: autenticación y estado de interfaz.
- `src/services/`: operaciones de Firestore.
- `src/lib/`: inicialización del SDK Firebase.
- `docs/`: revisión manual, accesibilidad, seguridad y fotos.
- `firestore.rules`: reglas actuales; `firestore.rules.v2` es solo una
  propuesta para el emulador.
- [LEEME-guia.txt](LEEME-guia.txt): guía de publicación para personas no técnicas.

La configuración local se guarda en variables `VITE_FIREBASE_*`. No agregues
archivos `.env.local` al repositorio. Antes de publicar, seguí la guía y pedí
una revisión humana de reglas, dominios y privacidad.
