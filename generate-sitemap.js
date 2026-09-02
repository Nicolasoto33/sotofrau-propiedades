const fs = require("fs");
const path = require("path");

const BASE_URL =
  "https://sotofraupropiedades.cl";

const propiedadesPath =
  path.join(__dirname, "propiedades.js");

const sitemapPath =
  path.join(__dirname, "sitemap.xml");


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

   Solo necesitamos:
   - id
   - publicada
   - estado
===================================================== */

const propiedades = [];

const expresion =
  /{\s*id:\s*(\d+),[\s\S]*?publicada:\s*(true|false),[\s\S]*?estado:\s*"([^"]+)"/g;

let coincidencia;

while (
  (coincidencia =
    expresion.exec(codigo)) !== null
) {

  propiedades.push({

    id:
      Number(
        coincidencia[1]
      ),

    publicada:
      coincidencia[2] ===
      "true",

    estado:
      coincidencia[3]

  });

}


/* =====================================================
   VERIFICAR QUE SE ENCONTRARON PROPIEDADES
===================================================== */

if (
  propiedades.length === 0
) {

  throw new Error(
    "No se encontraron propiedades válidas en propiedades.js"
  );

}


/* =====================================================
   PROPIEDADES DISPONIBLES

   Se incluyen solamente las propiedades que:
   1. están publicadas
   2. tienen estado disponible
===================================================== */

const propiedadesDisponibles =
  propiedades
    .filter(
      function(propiedad) {

        return (
          propiedad.publicada === true &&
          propiedad.estado === "disponible"
        );

      }
    )
    .sort(
      function(a, b) {

        return b.id - a.id;

      }
    );


/* =====================================================
   GENERAR URLs
===================================================== */

const urls = [

  `${BASE_URL}/`

];


propiedadesDisponibles.forEach(
  function(propiedad) {

    urls.push(
      `${BASE_URL}/propiedad.html?id=${propiedad.id}`
    );

  }
);


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
   GENERAR SITEMAP XML
===================================================== */

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls
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
   MENSAJE DEL BUILD
===================================================== */

console.log(
  "Sitemap generado correctamente."
);

console.log(
  `URLs totales: ${urls.length}`
);

console.log(
  `Propiedades disponibles incluidas: ${propiedadesDisponibles.length}`
);

console.log(
  propiedadesDisponibles
    .map(
      function(propiedad) {

        return `ID ${propiedad.id}`;

      }
    )
    .join(", ")
);
