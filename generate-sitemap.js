const fs = require("fs");
const path = require("path");

const BASE_URL =
  "https://sotofraupropiedades.cl";

const propiedadesPath =
  path.join(
    __dirname,
    "propiedades.js"
  );

const sitemapPath =
  path.join(
    __dirname,
    "sitemap.xml"
  );


/* =====================================================
   VERIFICAR ARCHIVOS
===================================================== */

if (!fs.existsSync(propiedadesPath)) {

  throw new Error(
    "No se encontró propiedades.js"
  );

}


/* =====================================================
   LEER propiedades.js
===================================================== */

const codigo =
  fs.readFileSync(
    propiedadesPath,
    "utf8"
  );


/* =====================================================
   EXTRAER PROPIEDADES
===================================================== */

const propiedades = [];

const expresion =
  /{\s*id:\s*(\d+),[\s\S]*?publicada:\s*(true|false),/g;

let coincidencia;

while (
  (
    coincidencia =
      expresion.exec(codigo)
  ) !== null
) {

  propiedades.push({

    id:
      Number(
        coincidencia[1]
      ),

    publicada:
      coincidencia[2] ===
      "true"

  });

}


/* =====================================================
   VERIFICAR PROPIEDADES
===================================================== */

if (
  propiedades.length === 0
) {

  throw new Error(
    "No se encontraron propiedades válidas en propiedades.js"
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
