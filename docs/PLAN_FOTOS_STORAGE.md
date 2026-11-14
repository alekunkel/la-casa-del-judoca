# Plan para migrar fotos a Firebase Storage

## Diseño propuesto

- Guardar cada foto en `listings/{uid}/{id}/{n}.jpg`, con `n` entre `0` y `3`.
- Convertir las imágenes a JPEG de hasta 800 px por lado y validar el tipo y el
  tamaño antes de subirlas.
- Guardar en Firestore solo las rutas o URLs de descarga, nunca los bytes
  codificados en base64.
- Mantener la descripción accesible de las fotos en los datos de la publicación.
- La propuesta de reglas está en `storage.rules`: lectura pública de fotos,
  escritura de JPEG limitada al dueño y archivos de menos de 5 MB.

La lectura pública significa que cualquier persona que conozca la URL puede
acceder a la foto, incluso si la publicación está pendiente. Para impedirlo de
forma estricta habrá que cambiar el modelo de acceso y servir las fotos con
autorización.

## Migración de fotos existentes

1. Hacer una copia de seguridad de Firestore en un proyecto de desarrollo.
2. Recorrer `listings`, convertir los campos `photo` y `photos` a archivos y
   subirlos a las rutas propuestas.
3. Guardar las nuevas rutas en un campo nuevo y verificar que cada objeto se
   pueda leer antes de modificar el documento.
4. Cambiar el cliente para mostrar las rutas de Storage, incluyendo descripciones
   y compatibilidad temporal con data-URLs.
5. Comparar cantidades, tamaños y accesibilidad; luego, en otra operación
   aprobada por una persona, quitar los campos base64.
6. Diseñar y revisar el script de migración antes de ejecutarlo. No se incluye
   ni se ejecuta un migrador de producción en esta etapa.

Firebase Storage puede requerir activar un plan de pago. Antes de habilitarlo,
verificar las condiciones, cuotas y precios vigentes en la consola oficial de
Firebase; no asumir que la cuota gratuita sigue siendo la misma.
