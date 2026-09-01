const fs = require("fs");

const propiedadesPath = "./propiedades.js";

if (!fs.existsSync(propiedadesPath)) {
  throw new Error("No se encontró propiedades.js");
}

const codigo = fs.readFileSync(propiedadesPath, "utf8");

/*
  Buscamos únicamente el arreglo:
  const propiedades = [ ... ];
  
  Así NO ejecutamos el código del navegador
  que contiene document.addEventListener(), etc.
*/

const inicio = codigo.indexOf("const propiedades = [");

if (inicio === -1) {
  throw new Error(
    "No se encontró 'const propiedades = [' en propiedades.js"
  );
}

const inicioArray = codigo.indexOf("[", inicio);

const finArray = codigo.indexOf("];", inicioArray);

if (finArray === -1) {
  throw new Error(
    "No se encontró el cierre del arreglo de propiedades."
  );
}

const textoArray = codigo.slice(
  inicioArray,
  finArray + 1
);

/*
  Convertimos el arreglo JavaScript en un objeto.
  Como aquí solo necesitamos id y publicada,
  extraemos esos valores mediante expresión regular.
*/

const propiedades = [];

const bloques = textoArray.match(
  /{\s*id:\s*\d+,[\s\S]*?}/g
);

if (!bloques) {
  throw new Error(
    "No se encontraron propiedades dentro del arreglo."
  );
}

for (const bloque of bloques) {
  const idMatch = bloque.match(
    /id:\s*(\d+)/
  );

  const publicadaMatch = bloque.match(
    /publicada:\s*(true|false)/
  );

  if (!idMatch || !publicadaMatch) {
    continue;
  }

  propiedades.push({
    id: Number(idMatch[1]),
    publicada: publicadaMatch[1] === "true"
  });
}

/*
  Generar URLs
*/

const baseUrl =
  "https://sotofraupropiedades.cl";

const urls = [
  `${baseUrl}/`
];

propiedades
  .filter(
    propiedad =>
      propiedad.publicada === true
  )
  .forEach(
    propiedad => {
      urls.push(
        `${baseUrl}/propiedad.html?id=${propiedad.id}`
      );
    }
  );

/*
  Crear sitemap.xml
*/

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls
  .map(
    url => `  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join("\n\n")}

</urlset>
`;

fs.writeFileSync(
  "./sitemap.xml",
  sitemap,
  "utf8"
);

console.log(
  `Sitemap generado correctamente con ${urls.length} URLs.`
);
