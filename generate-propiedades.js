const fs = require("fs");
const path = require("path");


/* =====================================================
   CONFIGURACIÓN GENERAL
===================================================== */

const dominio =
  "https://sotofraupropiedades.cl";


const carpetaPropiedades =
  path.join(
    __dirname,
    "content",
    "propiedades"
  );


const archivoSalida =
  path.join(
    __dirname,
    "propiedades.generated.js"
  );


const archivoPlantillaPropiedad =
  path.join(
    __dirname,
    "propiedad.html"
  );


const carpetaPaginasPropiedad =
  path.join(
    __dirname,
    "propiedad"
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


  return ruta.replace(
    /^\/+/,
    ""
  );

}



/* =====================================================
   LEER ARCHIVOS JSON
===================================================== */

function cargarPropiedades() {

  if (
    !fs.existsSync(
      carpetaPropiedades
    )
  ) {

    throw new Error(
      "No existe la carpeta content/propiedades."
    );

  }


  const archivos =
    fs
      .readdirSync(
        carpetaPropiedades
      )
      .filter(
        function(archivo) {

          return archivo.endsWith(
            ".json"
          );

        }
      );


  const propiedades = [];


  archivos.forEach(
    function(archivo) {

      const rutaArchivo =
        path.join(
          carpetaPropiedades,
          archivo
        );


      const contenido =
        fs.readFileSync(
          rutaArchivo,
          "utf8"
        );


      let propiedad;


      try {

        propiedad =
          JSON.parse(
            contenido
          );

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


      propiedad.id =
        Number(
          propiedad.id
        );


      if (
        Number.isNaN(
          propiedad.id
        )
      ) {

        throw new Error(
          "El ID de " +
            archivo +
            " no es válido."
        );

      }


      /*
        NORMALIZAR IMAGEN PRINCIPAL
      */

      if (
        propiedad.imagen
      ) {

        propiedad.imagen =
          normalizarRutaImagen(
            propiedad.imagen
          );

      }


      /*
        NORMALIZAR GALERÍA
      */

      if (
        Array.isArray(
          propiedad.fotos
        )
      ) {

        propiedad.fotos =
          propiedad.fotos.map(
            normalizarRutaImagen
          );

      }


      /* =================================================
         ELIMINAR DATOS PRIVADOS DEL ARCHIVO PÚBLICO
      ================================================= */

      delete propiedad.notasInternas;


      propiedades.push(
        propiedad
      );

    }
  );


  return propiedades;

}



/* =====================================================
   VALIDAR IDs DUPLICADOS
===================================================== */

function validarIds(
  propiedades
) {

  const ids =
    new Set();


  propiedades.forEach(
    function(propiedad) {

      if (
        ids.has(
          propiedad.id
        )
      ) {

        throw new Error(
          "ID duplicado detectado: " +
            propiedad.id
        );

      }


      ids.add(
        propiedad.id
      );

    }
  );

}



/* =====================================================
   ORDENAR POR ID
===================================================== */

function ordenarPropiedades(
  propiedades
) {

  return propiedades.sort(
    function(a, b) {

      return a.id - b.id;

    }
  );

}



/* =====================================================
   GENERAR JAVASCRIPT DE PROPIEDADES
===================================================== */

function generarArchivo(
  propiedades
) {

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
   ESCAPAR TEXTO PARA META TAGS
===================================================== */

function escaparHTML(
  texto
) {

  return String(
    texto || ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    );

}



/* =====================================================
   LIMPIAR TEXTO
===================================================== */

function limpiarTexto(
  texto
) {

  return String(
    texto || ""
  )
    .replace(
      /\s+/g,
      " "
    )
    .trim();

}



/* =====================================================
   OBTENER DESCRIPCIÓN SOCIAL
===================================================== */

function obtenerDescripcionSocial(
  propiedad
) {

  const partes = [];


  if (
    propiedad.operacion
  ) {

    partes.push(
      propiedad.operacion
    );

  }


  if (
    propiedad.precio
  ) {

    partes.push(
      propiedad.precio
    );

  }


  if (
    propiedad.ubicacion
  ) {

    partes.push(
      propiedad.ubicacion
    );

  }


  if (
    Array.isArray(
      propiedad.caracteristicas
    )
  ) {

    propiedad.caracteristicas
      .slice(
        0,
        4
      )
      .forEach(
        function(caracteristica) {

          if (
            caracteristica
          ) {

            partes.push(
              caracteristica
            );

          }

        }
      );

  }


  let descripcion =
    limpiarTexto(
      partes.join(
        " · "
      )
    );


  /*
    Evitar descripciones excesivamente largas
    en WhatsApp, Facebook y otras redes.
  */

  if (
    descripcion.length > 220
  ) {

    descripcion =
      descripcion.substring(
        0,
        217
      ) + "...";

  }


  return descripcion;

}



/* =====================================================
   OBTENER IMAGEN PRINCIPAL
===================================================== */

function obtenerImagenPrincipal(
  propiedad
) {

  let rutaImagen =
    "";


  /*
    1. Imagen principal elegida en el administrador
  */

  if (
    propiedad.imagen
  ) {

    rutaImagen =
      propiedad.imagen;

  }


  /*
    2. Primera imagen de la galería
  */

  else if (
    Array.isArray(
      propiedad.fotos
    ) &&
    propiedad.fotos.length > 0
  ) {

    rutaImagen =
      propiedad.fotos[0];

  }


  /*
    3. Imagen de respaldo
  */

  else {

    rutaImagen =
      "android-chrome-512x512.png";

  }


  rutaImagen =
    normalizarRutaImagen(
      rutaImagen
    );


  return (
    dominio +
    "/" +
    rutaImagen
  );

}



/* =====================================================
   ACTUALIZAR META TAG POR ID
===================================================== */

function actualizarMeta(
  html,
  idMeta,
  contenido
) {

  const patron =
    new RegExp(
      '<meta\\b(?=[^>]*\\bid=["\\\']' +
        idMeta +
        '["\\\'])[^>]*>',
      "i"
    );


  if (
    !patron.test(
      html
    )
  ) {

    return html;

  }


  return html.replace(
    patron,
    function(etiqueta) {

      const valor =
        escaparHTML(
          contenido
        );


      /*
        Si ya existe content=""
      */

      if (
        /\bcontent\s*=\s*["'][^"']*["']/i.test(
          etiqueta
        )
      ) {

        return etiqueta.replace(
          /\bcontent\s*=\s*["'][^"']*["']/i,
          'content="' +
            valor +
            '"'
        );

      }


      /*
        Si por alguna razón no existe
        el atributo content
      */

      return etiqueta.replace(
        />$/,
        ' content="' +
          valor +
          '">'
      );

    }
  );

}



/* =====================================================
   INSERTAR CANONICAL
===================================================== */

function insertarCanonical(
  html,
  url
) {

  /*
    Si la plantilla ya tuviese canonical,
    se actualiza.
  */

  const canonicalExistente =
    /<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i;


  if (
    canonicalExistente.test(
      html
    )
  ) {

    return html.replace(
      canonicalExistente,
      '<link rel="canonical" href="' +
        escaparHTML(
          url
        ) +
        '">'
    );

  }


  /*
    Si no existe, se agrega después del título.
  */

  return html.replace(
    /<\/title>/i,
    '</title>\n\n  <link rel="canonical" href="' +
      escaparHTML(
        url
      ) +
      '">'
  );

}



/* =====================================================
   INSERTAR BASE PARA RUTAS INTERNAS
===================================================== */

function insertarBase(
  html
) {

  if (
    /<base\b/i.test(
      html
    )
  ) {

    return html;

  }


  return html.replace(
    /<head>/i,
    '<head>\n\n  <base href="/">'
  );

}



/* =====================================================
   FIJAR ID DE LA PROPIEDAD EN LA PÁGINA GENERADA
===================================================== */

function fijarIdPropiedad(
  html,
  id
) {

  const patron =
    /const\s+id\s*=\s*Number\s*\(\s*parametros\.get\s*\(\s*["']id["']\s*\)\s*\)\s*;/m;


  if (
    !patron.test(
      html
    )
  ) {

    throw new Error(
      "No fue posible localizar el bloque de ID dentro de propiedad.html."
    );

  }


  return html.replace(
    patron,
    "const id = " +
      Number(id) +
      ";"
  );

}



/* =====================================================
   GENERAR PÁGINA INDIVIDUAL
===================================================== */

function generarPaginaPropiedad(
  plantilla,
  propiedad
) {

  const url =
    dominio +
    "/propiedad/" +
    propiedad.id +
    "/";


  const titulo =
    limpiarTexto(
      propiedad.titulo ||
      "Propiedad"
    ) +
    " | Sotofrau Propiedades";


  const descripcion =
    obtenerDescripcionSocial(
      propiedad
    );


  const imagen =
    obtenerImagenPrincipal(
      propiedad
    );


  let html =
    plantilla;


  /*
    Las páginas se encuentran dentro de:
    /propiedad/ID/

    BASE permite que logo, imágenes,
    JS y enlaces sigan apuntando a la raíz.
  */

  html =
    insertarBase(
      html
    );


  /*
    TÍTULO
  */

  html =
    html.replace(
      /<title>[\s\S]*?<\/title>/i,
      "<title>" +
        escaparHTML(
          titulo
        ) +
        "</title>"
    );


  /*
    META DESCRIPTION
  */

  html =
    actualizarMeta(
      html,
      "metaDescription",
      descripcion
    );


  /*
    OPEN GRAPH
  */

  html =
    actualizarMeta(
      html,
      "ogTitle",
      titulo
    );


  html =
    actualizarMeta(
      html,
      "ogDescription",
      descripcion
    );


  html =
    actualizarMeta(
      html,
      "ogImage",
      imagen
    );


  html =
    actualizarMeta(
      html,
      "ogImageAlt",
      propiedad.titulo ||
      "Sotofrau Propiedades"
    );


  html =
    actualizarMeta(
      html,
      "ogUrl",
      url
    );


  /*
    TWITTER / X
  */

  html =
    actualizarMeta(
      html,
      "twitterTitle",
      titulo
    );


  html =
    actualizarMeta(
      html,
      "twitterDescription",
      descripcion
    );


  html =
    actualizarMeta(
      html,
      "twitterImage",
      imagen
    );


  html =
    actualizarMeta(
      html,
      "twitterImageAlt",
      propiedad.titulo ||
      "Sotofrau Propiedades"
    );


  /*
    CANONICAL
  */

  html =
    insertarCanonical(
      html,
      url
    );


  /*
    FIJAR ID.

    Esto permite que la página:
    /propiedad/45/

    cargue directamente la propiedad 45
    sin necesitar ?id=45.
  */

  html =
    fijarIdPropiedad(
      html,
      propiedad.id
    );


  return html;

}



/* =====================================================
   GENERAR PÁGINAS PARA COMPARTIR
===================================================== */

function generarPaginasPropiedades(
  propiedades
) {

  if (
    !fs.existsSync(
      archivoPlantillaPropiedad
    )
  ) {

    throw new Error(
      "No existe propiedad.html."
    );

  }


  const plantilla =
    fs.readFileSync(
      archivoPlantillaPropiedad,
      "utf8"
    );


  /*
    Esta carpeta es 100% generada.

    Se elimina en cada build para evitar
    que una propiedad marcada como no publicada
    conserve una página antigua.
  */

  if (
    fs.existsSync(
      carpetaPaginasPropiedad
    )
  ) {

    fs.rmSync(
      carpetaPaginasPropiedad,
      {
        recursive: true,
        force: true
      }
    );

  }


  fs.mkdirSync(
    carpetaPaginasPropiedad,
    {
      recursive: true
    }
  );


  const publicadas =
    propiedades.filter(
      function(propiedad) {

        return propiedad.publicada === true;

      }
    );


  publicadas.forEach(
    function(propiedad) {

      const carpeta =
        path.join(
          carpetaPaginasPropiedad,
          String(
            propiedad.id
          )
        );


      fs.mkdirSync(
        carpeta,
        {
          recursive: true
        }
      );


      const html =
        generarPaginaPropiedad(
          plantilla,
          propiedad
        );


      const archivo =
        path.join(
          carpeta,
          "index.html"
        );


      fs.writeFileSync(
        archivo,
        html,
        "utf8"
      );

    }
  );


  console.log(
    "Páginas sociales generadas: " +
      publicadas.length
  );

}



/* =====================================================
   EJECUCIÓN
===================================================== */

try {

  const propiedades =
    cargarPropiedades();


  validarIds(
    propiedades
  );


  ordenarPropiedades(
    propiedades
  );


  /*
    GENERAR BASE DE DATOS PÚBLICA
  */

  generarArchivo(
    propiedades
  );


  /*
    GENERAR PÁGINAS INDIVIDUALES
    PARA WHATSAPP / FACEBOOK / SEO
  */

  generarPaginasPropiedades(
    propiedades
  );


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
        .map(
          function(propiedad) {

            return propiedad.id;

          }
        )
        .join(", ")
  );


} catch (error) {

  console.error(
    "Error al generar propiedades:"
  );


  console.error(
    error.message
  );


  process.exit(1);

}
