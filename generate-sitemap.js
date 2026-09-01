const fs = require("fs");
const vm = require("vm");

const propiedadesPath = "./propiedades.js";

if (!fs.existsSync(propiedadesPath)) {
  throw new Error("No se encontró propiedades.js");
}

const codigo = fs.readFileSync(propiedadesPath, "utf8");

const sandbox = {};
vm.createContext(sandbox);

vm.runInContext(
  codigo + "\nthis.__propiedades = propiedades;",
  sandbox
);

const propiedades = sandbox.__propiedades;

if (!Array.isArray(propiedades)) {
  throw new Error("No se pudo obtener el arreglo de propiedades.");
}

const baseUrl = "https://sotofraupropiedades.cl";

const urls = [];

/* Página principal */
urls.push(`${baseUrl}/`);

/* Propiedades publicadas */
propiedades
  .filter(propiedad => propiedad.publicada === true)
  .forEach(propiedad => {
    urls.push(
      `${baseUrl}/propiedad.html?id=${propiedad.id}`
    );
  });

const contenido = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

${urls.map(url => `  <url>
    <loc>${url}</loc>
  </url>`).join("\n\n")}

</urlset>
`;

fs.writeFileSync(
  "./sitemap.xml",
  contenido,
  "utf8"
);

console.log(
  `Sitemap generado correctamente con ${urls.length} URLs.`
);
