# Preparación de seguridad

Este documento describe tareas para una revisión humana. No se aplicaron reglas
nuevas ni cambios de configuración en Firebase de producción.

## Clave pública de Firebase

- La clave web no es un secreto, pero debe restringirse por dominio desde Google
  Cloud Console a los dominios locales y publicados que realmente se usen.
- Revisar periódicamente las restricciones y las API asociadas a la clave.
- Mantener la configuración en variables `VITE_FIREBASE_*`; una variable Vite
  queda visible en el navegador y no sirve para guardar secretos del servidor.

## App Check

Evaluar Firebase App Check para las aplicaciones web, escoger el proveedor
compatible con el hosting y configurar primero un proyecto de desarrollo.
Observar métricas antes de exigir tokens en producción para no bloquear a las
personas usuarias.

## Reglas y administración

- `firestore.rules` es la versión actualmente usada por la guía de despliegue.
- `firestore.rules.v2` es solo una propuesta para revisar y probar en el
  emulador. No publicarla desde este repositorio sin aprobación humana.
- La propuesta usa el custom claim `admin`; `scripts/set-admin-claims.mjs`
  requiere credenciales locales y bloquea explícitamente el id de producción.
- Los scripts de datos requieren proyecto explícito y no deben ejecutarse con
  credenciales ni datos de producción.

## Privacidad

El proyecto guarda correos, números de WhatsApp, publicaciones, fotos y
opiniones. Preparar una política de privacidad clara que explique qué datos se
guardan, para qué se usan, quién puede verlos, cuánto tiempo se conservan y
cómo pedir su corrección o eliminación.

Revisar las obligaciones aplicables de la Ley 25.326 de Protección de los Datos
Personales con una persona profesional. Esta nota es orientación general, no
asesoramiento legal.
