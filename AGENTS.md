# Funciones que se deben conservar

Por instrucción del propietario, conservar todos los filtros del buscador, los botones de contacto y compartir, las fotos sociales individuales y la consulta automática de UF. No eliminarlos ni simplificarlos salvo petición explícita del propietario.

Antes de modificar o publicar, comparar `main` con `contenido-borradores`: ambas ramas deben conservar las mejoras públicas y las del panel. Nunca publicar una rama antigua sobre el sitio vigente. El panel usa `contenido-borradores` y `editorial_workflow`; la producción sale de `main`.

Validar `node generate-propiedades.js`, `node generate-sitemap.js`, `node tests/site-contract.cjs` y `node --test tests/uf.test.cjs`. Si se modifican filtros, compartir o diseño, probar escritorio y móvil en navegador. Mantener `fotos` como array de strings y las propiedades existentes sin migraciones innecesarias.

La UF debe corresponder exactamente al día en America/Santiago. No presentar un valor anterior como vigente. Consultar automáticamente fuentes públicas, conservar valores futuros ya publicados con su fecha y permitir consultar el SII aun cuando falle la conexión. Nunca fijar manualmente una UF en el código.
