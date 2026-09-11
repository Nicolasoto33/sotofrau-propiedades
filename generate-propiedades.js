const fs = require("fs");
const path = require("path");

const carpetaPropiedades = path.join(
  __dirname,
  "content",
  "propiedades"
);

const archivoSalida = path.join(
  __dirname,
  "propiedades.generated.js"
);

/* =====================================================
   NORMALIZAR RUTAS DE IMÁGENES
===================================================== */

function normalizarRutaImagen(ruta) {
  if (
    typeof ruta !== "string" ||
    ruta.trim() === ""
  ) {
    return ruta;
  }

  return ruta.replace(/^\/+/, "");
}

/* =====================================================
   LEER ARCHIVOS JSON
===================================================== */

function cargarPropiedades() {
  if (!fs.existsSync(carpetaPropiedades)) {
    throw new Error(
      "No existe la carpeta content/propiedades."
    );
  }

  const archivos = fs
    .readdirSync(carpetaPropiedades)
    .filter(function (archivo) {
      return archivo.endsWith(".json");
    });

  const propiedades = [];

  archivos.forEach(function (archivo) {
    const rutaArchivo = path.join(
      carpetaPropiedades,
      archivo
    );

    const contenido = fs.readFileSync(
      rutaArchivo,
      "utf8"
    );

    let propiedad;

    try {
      propiedad = JSON.parse(contenido);
    } catch (error) {
      throw new Error(
        "JSON inválido en " +
          archivo +
          ": " +
          error.message
      );
    }

    if (
      propiedad.id === undefined ||
      propiedad.id === null
    ) {
      throw new Error(
        "La propiedad " +
          archivo +
          " no tiene ID."
      );
    }

    propiedad.id = Number(propiedad.id);

    if (Number.isNaN(propiedad.id)) {
      throw new Error(
        "El ID de " +
          archivo +
          " no es válido."
      );
    }

    if (propiedad.imagen) {
      propiedad.imagen =
        normalizarRutaImagen(
          propiedad.imagen
        );
    }

    if (Array.isArray(propiedad.fotos)) {
      propiedad.fotos =
        propiedad.fotos.map(
          normalizarRutaImagen
        );
    }

    propiedades.push(propiedad);
  });

  return propiedades;
}

/* =====================================================
   VALIDAR IDs DUPLICADOS
===================================================== */

function validarIds(propiedades) {
  const ids = new Set();

  propiedades.forEach(function (propiedad) {
    if (ids.has(propiedad.id)) {
      throw new Error(
        "ID duplicado detectado: " +
          propiedad.id
      );
    }

    ids.add(propiedad.id);
  });
}

/* =====================================================
   ORDENAR POR ID
===================================================== */

function ordenarPropiedades(propiedades) {
  return propiedades.sort(
    function (a, b) {
      return a.id - b.id;
    }
  );
}

/* =====================================================
   GENERAR JAVASCRIPT
===================================================== */

function generarArchivo(propiedades) {
  const encabezado = `/*
=====================================================
ARCHIVO GENERADO AUTOMÁTICAMENTE
SOTOFRAU PROPIEDADES

NO EDITAR MANUALMENTE.

Origen:
content/propiedades/*.json
=====================================================
*/

`;

  const contenido =
    encabezado +
    "const propiedades = " +
    JSON.stringify(
      propiedades,
      null,
      2
    ) +
    ";\n";

  fs.writeFileSync(
    archivoSalida,
    contenido,
    "utf8"
  );
}

/* =====================================================
   EJECUCIÓN
===================================================== */

try {
  const propiedades =
    cargarPropiedades();

  validarIds(propiedades);

  ordenarPropiedades(propiedades);

  generarArchivo(propiedades);

  console.log(
    "Propiedades generadas correctamente."
  );

  console.log(
    "Total de propiedades: " +
      propiedades.length
  );

  console.log(
    "IDs incluidos: " +
      propiedades
        .map(function (propiedad) {
          return propiedad.id;
        })
        .join(", ")
  );
} catch (error) {
  console.error(
    "Error al generar propiedades:"
  );

  console.error(error.message);

  process.exit(1);
}
