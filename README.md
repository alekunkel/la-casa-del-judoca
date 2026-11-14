# La Casa del Judoka

Sitio comunitario para publicar y encontrar indumentaria de judo nueva y usada.
La aplicación está migrándose de HTML con lógica imperativa a React 18 y Vite.
Firebase proporciona autenticación y almacenamiento de datos.

## Requisitos

- Node.js y npm.
- Variables de entorno de Firebase en `.env.local` (ver `.env.example`).

## Desarrollo

```sh
npm install
npm run dev
```

Para generar la versión de producción, ejecutá `npm run build`. El resultado
queda en `dist/`.

## Estructura

- `src/`: aplicación, componentes, servicios y estilos.
- `docs/`: guías de revisión manual y documentación del proyecto.
- `firestore.rules`: reglas actuales de Firestore; no publicarlas desde este
  repositorio sin revisión humana.
- `LEEME-guia.txt`: guía de despliegue para personas no técnicas.

La configuración local se guarda en variables `VITE_FIREBASE_*`. No agregues
archivos `.env.local` al repositorio.
