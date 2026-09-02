const fs = require("fs");
const path = require("path");

const BASE_URL = "https://sotofraupropiedades.cl";

const propiedadesPath = path.join(
  __dirname,
  "propiedades.js"
);

const sitemapPath = path.join(
  __dirname,
  "sitemap.xml"
);

if (!fs.existsSync(propiedadesPath)) {
  throw new Error(
    "No se encontró propiedades.js"
  );
}

const codigo =
  fs.readFileSync(
    propiedadesPath,
    "utf8"
  );

/*
  Buscamos el arreglo:
  const propiedades = [ ... ];

  No ejecutamos propiedades.js.
  Solo extraemos ID y estado publicada.
*/

const inicio =
  codigo.indexOf(
    "const propiedades = ["
  );

if (inicio === -1) {
  throw new Error(
    "No se encontró 'const propiedades = [' en propiedades.js"
  );
}

const inicioArray =
  codigo.indexOf(
    "[",
    inicio
  );

const finArray =
  codigo.indexOf(
    "];",
    inicioArray
  );

if (inicioArray === -1) {
  throw new Error(
    "No se encontró el inicio del arreglo de propiedades."
  );
}

if (finArray === -1) {
  throw new Error(
    "No se encontró el cierre del arreglo de propiedades."
  );
}

const textoArray =
  codigo.slice(
    inicioArray,
    finArray + 1
  );

/*
  Extraemos cada propiedad que tenga:
  id: número
  publicada: true/false

  La expresión busca desde un objeto que
  comienza con id hasta antes del siguiente
  objeto de propiedad.
*/

const propiedades = [];

const bloques =
  textoArray.match(
    /{\s*id:\s*\d+,[\s\S]*?(?=\n\s*},|\n\s*})/g
  );

if (!bloques) {
  throw new Error(
    "No se encontraron propiedades dentro del arreglo."
  );
}

for (const bloque of bloques) {

  const idMatch =
    bloque.match(
      /id:\s*(\d+)/
    );

  const publicadaMatch =
    bloque.match(
      /publicada:\s*(true|false)/
    );

  if (
    !idMatch ||
    !publicadaMatch
  ) {
    continue;
  }

  propiedades.push({
    id:
      Number(
        idMatch[1]
      ),

    publicada:
      publicadaMatch[1] ===
      "true"
  });

}

/*
  Eliminar posibles duplicados
*/

const idsPublicados =
  [
    ...new Set(
      propiedades
        .filter(
          propiedad =>
            propiedad.publicada === true
        )
        .map(
          propiedad =>
            propiedad.id
        )
    )
  ];

/*
  URLs del sitemap

  La página principal siempre se incluye.
*/

const urls = [
  `${BASE_URL}/`
];

/*
  Agregar solamente propiedades publicadas.
*/

idsPublicados
  .forEach(
    id => {

      urls.push(
        `${BASE_URL}/propiedad.html?id=${id}`
      );

    }
  );

/*
  Generar sitemap XML
*/

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>

${urls
  .map(
    url => `  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join("\n\n")}

</urlset>
`;

/*
  Guardar sitemap.xml
*/

fs.writeFileSync(
  sitemapPath,
  sitemap,
  "utf8"
);

console.log(
  `Sitemap generado correctamente con ${urls.length} URLs.`
);

console.log(
  `Propiedades publicadas incluidas: ${idsPublicados.length}`
);
