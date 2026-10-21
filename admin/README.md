# Panel de propiedades

## Uso

1. Completar un ID único antes de agregar fotos. No cambiar el ID de fichas existentes.
2. En **Fotografías**, usar **Seleccionar varias fotos**. En escritorio se pueden seleccionar con Ctrl/Shift; en móvil depende del selector del dispositivo. Se conserva el orden que entrega el selector.
3. Revisar las miniaturas, ordenar con las flechas y quitar fotos si hace falta. Se puede deshacer la última eliminación. Quitar no elimina archivos del repositorio.
4. En **Imagen principal**, desplegar **Elegir imagen principal desde la galería**. La portada es independiente de la primera foto de la galería, igual que en el sitio existente.
5. Revisar la vista previa y guardar el borrador. Las fotos se preparan localmente hasta guardar. Los errores se muestran por archivo; se pueden seleccionar nuevamente los que fallaron.

JPG, PNG, WebP y AVIF; máximo 15 MB por archivo. HEIC debe convertirse previamente. Conviene optimizar las fotos antes de subirlas. No se recomprimen ni alteran automáticamente.

En escritorio la vista previa está al lado. En pantallas de hasta 760 px se apilan formulario y vista previa con desplazamiento independiente; el botón de ojo de Decap permite ocultar/mostrar la vista previa. El selector inferior permite saltar entre secciones.

## Publicación

El backend GitHub, `contenido-borradores`, `editorial_workflow` y las rutas de contenido siguen iguales. Publicar en Decap actualiza la rama de contenido. Para actualizar el sitio público deben pasar los cambios a `main` y completarse el despliegue de Netlify según su configuración. Esta mejora no modifica ni automatiza ese paso.

## Compatibilidad comprobada

Se conserva Decap CMS **3.15.1**. En esa versión la biblioteca integrada toma `files[0]` en `MediaLibrary.handlePersist`; `allow_multiple` por sí solo no implementa carga múltiple con la biblioteca integrada.

Fuentes del código exacto:

- https://github.com/decaporg/decap-cms/blob/decap-cms%403.15.1/packages/decap-cms-core/src/components/MediaLibrary/MediaLibrary.js
- https://github.com/decaporg/decap-cms/blob/decap-cms%403.15.1/packages/decap-cms-core/src/actions/mediaLibrary.ts
- https://github.com/decaporg/decap-cms/blob/decap-cms%403.15.1/packages/decap-cms-core/src/actions/media.ts

La extensión usa `CMS.registerWidget`, `registerPreviewTemplate` y el hook `onPersistMedia` que Decap entrega al widget. No usa tokens, escrituras GitHub propias, bibliotecas de medios externas ni cambios al almacén interno. Las fotos se procesan secuencialmente mediante la ruta de borrador normal. Verifica la confirmación `ADD_DRAFT_ENTRY_MEDIA_FILE` y la carpeta antes de añadir cada ruta. Este contrato debe volver a probarse al actualizar Decap.

`fotos` sigue siendo `string[]`, `imagen` sigue siendo un string y el resto de los campos permanece plano. No se migran propiedades ni se cambia el generador. Se generan nombres únicos para evitar sobrescribir archivos. Los duplicados de contenido ya presentes en el borrador se reutilizan porque Decap identifica estos archivos por SHA-256.

La vista previa resuelve las imágenes de la carpeta actual por el caché de medios de Decap, para mostrar también las fotos aún no guardadas. Conserva rutas históricas y externas. Los textos se renderizan como texto React, sin insertar HTML de los campos.

## Pruebas

Sin dependencias adicionales:

```sh
node --check admin/admin.js
node --check admin/gallery-utils.js
node --test tests/gallery.test.cjs
node generate-propiedades.js
node generate-sitemap.js
```

Prueba de navegador: requiere Playwright y Edge. Descargar el bundle oficial `https://unpkg.com/decap-cms@3.15.1/dist/decap-cms.js` fuera del repositorio, definir `DECAP_BUNDLE` con su ruta absoluta y ejecutar `node tests/admin.browser.cjs`. El módulo `playwright` debe estar disponible para Node. El servidor de prueba solo escucha en `127.0.0.1:8765` y se cierra al terminar.

La prueba sirve el panel real y el bundle exacto, reemplazando únicamente el backend por un doble local que captura las escrituras. Comprueba carga de tres imágenes, decodificación de miniaturas, duplicados y HEIC, reordenamiento, quitar/deshacer, portada, rutas JSON, archivos adjuntos y `useWorkflow`, ancho de 390 px y edición de la propiedad 56 sin alterar sus otros campos. No escribe propiedades ficticias en GitHub. Guarda capturas en el directorio temporal del sistema.

Antes de desplegar, queda la aceptación autenticada con GitHub/Netlify en un entorno de revisión: guardar un borrador, salir y volver a abrirlo, comprobar las fotos y revisar el PR editorial. Las pruebas locales no verifican credenciales, permisos remotos ni el despliegue de Netlify.

Para revertir, restaurar juntos `admin/index.html` y `admin/config.yml` de la revisión anterior. Las propiedades creadas con este panel mantienen el formato que entiende el panel anterior.
