# Plan de despliegue para la migración a `status`

Este documento es una guía humana para desplegar la migración sin tocar la
producción por accidente. No se ejecutó ningún despliegue ni `firebase deploy`
desde esta sesión.

## 1. Probar primero en un proyecto de desarrollo

1. Crear o reutilizar un proyecto Firebase de desarrollo, distinto del de
   producción.
2. Dejar la configuración local con `firebase.dev.json` y usar los emuladores
   para validar acciones de publicación, aprobación y destacado.
3. Ejecutar al menos:
   - `npm run lint`
   - `npm test`
   - `npm run build`
   - `npm run test:rules`
   - `npm run test:e2e` (si el entorno lo permite)
4. Revisar la salida y confirmar que no hay errores funcionales antes de tocar
   producción.

## 2. Asignar el claim `admin`

1. Usar `scripts/set-admin-claims.mjs` con un entorno de desarrollo o de
   staging, nunca con el id de producción.
2. Elegir las dos cuentas administradoras autorizadas.
3. Pedirles que cierren sesión y vuelvan a ingresar para que Firebase vuelva a
   resolver el nuevo claim en el token.
4. Verificar que el panel de administración aparece y que la UI no queda en un
   estado de acceso no autorizado.

## 3. Ejecutar la migración de datos

1. Ejecutar la migración en modo `--dry-run` sobre la copia de producción o un
   entorno de staging.
2. Revisar el resumen por colección, especialmente listings y wanted.
3. Si todo queda correcto, volver a ejecutar con `--apply` para actualizar los
   documentos.
4. La migración debe ser idempotente: una segunda ejecución sin cambios debe dar
   0 cambios.

Comandos orientativos:

```sh
node scripts/migrate-status.mjs --project <id-del-proyecto> --dry-run
node scripts/migrate-status.mjs --project <id-del-proyecto> --apply
```

## 4. Desplegar primero la interfaz

1. Desplegar la aplicación frontend antes de tocar las reglas de producción.
2. Validar que la UI sigue funcionando con el modelo nuevo y con la capa legacy
   de compatibilidad.
3. Confirmar que el acceso anónimo, los usuarios normales y los administradores
   ven lo que corresponde.
4. Revisar que la publicación, aprobación y destacado siguen funcionando con una
   cuenta de prueba.

## 5. Revalidar la migración antes de cambiar reglas

1. Ejecutar otra vez el `--dry-run` de `migrate-status.mjs`.
2. Si devuelve cambios, hay que investigar si alguien aprobó documentos con la
   interfaz antigua durante la ventana de migración.
3. Repetir el paso hasta que el resultado sea 0 cambios.
4. Solo entonces avanzar a la sustitución de las reglas.

## 6. Reemplazar las reglas y desplegarlas

1. Sustituir `firestore.rules` por `firestore.rules.v2` en el entorno objetivo.
2. Revisar una vez más el comportamiento en el proyecto de staging.
3. Desplegar las reglas con la aprobación humana explícita.
4. No hacer este paso sin validar primero el comportamiento y sin confirmar la
   versión de producción.

## 7. Verificación manual y con cuenta de prueba

La persona responsable debe comprobar:

- publicar una entrada y verla como pendiente para usuarios no admin,
- aprobar una entrada desde una cuenta admin,
- destacar una entrada y comprobar que aparece como destacado,
- verificar que un usuario anónimo no puede ver contenido pendiente ni la
  colección completa,
- verificar que las búsquedas (`wanted`) respetan la misma lógica,
- comprobar que el panel de administración y los permisos de edición se
  comportan correctamente.

Usar además la lista de comprobación en `docs/CHECKLIST_MANUAL.md`.

## 8. Cómo volver atrás

1. Mantener una copia del estado anterior de las reglas bajo un tag o nombre de
   respaldo, por ejemplo `v0-legacy`.
2. Si aparece un problema grave, revertir al tag previo y volver a restaurar la
   versión antigua de `firestore.rules`.
3. Si se tuvo una migración de datos con cambios reales, revisar primero si hay
   que aplicar una reversión manual o un script puntual antes de volver a la
   versión antigua.

## 9. Riesgos y advertencias

- No hacer `firebase deploy` desde una sesión sin confirmar el proyecto activo.
- No se debe ejecutar `--apply` de scripts de datos sin aprobación.
- Las reglas v2 requieren que el cliente use `status` y `featured` dentro del
  documento; la interfaz legacy no es compatible con ellas.
- El acceso por claims exige que cada administrador cierre sesión y vuelva a
  entrar para refrescar el token.

## 10. Criterio de cierre

La migración de producción solo se considera lista cuando:

- las pruebas locales pasaron,
- el dry-run de migración quedó en 0 cambios,
- las reglas se desplegaron con revisión humana,
- la verificación manual en el entorno correcto fue satisfactoria y
- la reversión está documentada y disponible.
