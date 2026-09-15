const fs = require("fs");
const path = require("path");

const BASE_URL =
  "https://sotofraupropiedades.cl";

const propiedadesDir =
  path.join(
    __dirname,
    "content",
    "propiedades"
  );

const sitemapPath =
  path.join(
    __dirname,
    "sitemap.xml"
  );


/* =====================================================
   VERIFICAR CARPETA
===================================================== */

if (!fs.existsSync(propiedadesDir)) {

  throw new Error(
    "No se encontró content/propiedades"
  );

}


/* =====================================================
   LEER ARCHIVOS JSON
===================================================== */

const archivos =
  fs.readdirSync(propiedadesDir)
    .filter(function(archivo) {

      return archivo.endsWith(".json");

    });


if (archivos.length === 0) {

  throw new Error(
    "No se encontraron archivos JSON en content/propiedades"
  );

}


/* =====================================================
   CARGAR PROPIEDADES
===================================================== */

const propiedades = [];

archivos.forEach(
  function(archivo) {

    const ruta =
      path.join(
        propiedadesDir,
        archivo
      );

    let propiedad;

    try {

      propiedad =
        JSON.parse(
          fs.readFileSync(
            ruta,
            "utf8"
          )
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


    const id =
      Number(propiedad.id);


    if (Number.isNaN(id)) {

      throw new Error(
        "ID inválido en " +
        archivo
      );

    }


    propiedades.push({

      id: id,

      publicada:
        propiedad.publicada === true

    });

  }
);


/* =====================================================
   VERIFICAR PROPIEDADES
===================================================== */

if (
  propiedades.length === 0
) {

  throw new Error(
    "No se encontraron propiedades válidas."
  );

}


/* =====================================================
   VERIFICAR IDS DUPLICADOS
===================================================== */

const ids =
  propiedades.map(
    function(propiedad) {

      return propiedad.id;

    }
  );

const idsUnicos =
  new Set(ids);


if (
  idsUnicos.size !== ids.length
) {

  throw new Error(
    "Se encontraron IDs de propiedades duplicados."
  );

}


/* =====================================================
   PROPIEDADES PUBLICADAS
===================================================== */

const propiedadesPublicadas =
  propiedades
    .filter(
      function(propiedad) {

        return (
          propiedad.publicada === true
        );

      }
    )
    .sort(
      function(a, b) {

        return b.id - a.id;

      }
    );


/* =====================================================
   URLS PRINCIPALES + SEO
===================================================== */

const urls = [

  `${BASE_URL}/`,

  `${BASE_URL}/corredor-propiedades-vina-del-mar.html`,

  `${BASE_URL}/venta-propiedades.html`,

  `${BASE_URL}/arriendo-propiedades.html`,

  `${BASE_URL}/administracion-propiedades.html`

];


/* =====================================================
   AGREGAR PROPIEDADES PUBLICADAS
===================================================== */

propiedadesPublicadas.forEach(
  function(propiedad) {

    urls.push(
      `${BASE_URL}/propiedad.html?id=${propiedad.id}`
    );

  }
);


/* =====================================================
   ELIMINAR POSIBLES URLS DUPLICADAS
===================================================== */

const urlsUnicas =
  [...new Set(urls)];


/* =====================================================
   ESCAPAR XML
===================================================== */

function escaparXML(texto) {

  return String(texto)
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );

}


/* =====================================================
   GENERAR SITEMAP
===================================================== */

const sitemap =
`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urlsUnicas
  .map(
    function(url) {

      return `  <url>
    <loc>${escaparXML(url)}</loc>
  </url>`;

    }
  )
  .join("\n\n")}

</urlset>
`;


/* =====================================================
   GUARDAR sitemap.xml
===================================================== */

fs.writeFileSync(
  sitemapPath,
  sitemap,
  "utf8"
);


/* =====================================================
   MENSAJES DE CONTROL
===================================================== */

console.log(
  "Sitemap generado correctamente."
);

console.log(
  `URLs totales: ${urlsUnicas.length}`
);

console.log(
  `Propiedades detectadas: ${propiedades.length}`
);

console.log(
  `Propiedades publicadas incluidas: ${propiedadesPublicadas.length}`
);

console.log(
  "IDs incluidos:"
);

console.log(
  propiedadesPublicadas
    .map(
      function(propiedad) {

        return `ID ${propiedad.id}`;

      }
    )
    .join(", ")
);
