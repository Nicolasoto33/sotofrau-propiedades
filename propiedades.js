const propiedades = [

  {
    id: 1,

    publicada: true,

    operacion: "arriendo",

    estado: "gestionada",

    estadoTexto: "Arrendada",

    titulo: "Habitación en arriendo",

    ubicacion: "Valparaíso · Sector Yungay",

    precio: "$260.000",

    imagen: "propiedades/1/1.jpeg",

    enlace: "propiedad.html?id=1",

    caracteristicas: [
      "🛏 1 dormitorio",
      "🚿 1 baño",
      "📐 72 m²",
      "🛋 Amoblado"
    ]
  },


  {
    id: 2,

    publicada: true,

    operacion: "arriendo",

    estado: "gestionada",

    estadoTexto: "Arrendada",

    titulo: "2° Piso Independiente en Arriendo",

    ubicacion: "Quilpué · Sector Teniente Serrano",

    precio: "$400.000",

    imagen: "propiedades/2/1.jpeg",

    enlace: "propiedad.html?id=2",

    caracteristicas: [
      "🛏 2 dormitorios",
      "🚿 1 baño",
      "📐 45 m²",
      "🚗 1 estacionamiento"
    ]
  },


  {
    id: 3,

    publicada: true,

    operacion: "arriendo",

    estado: "gestionada",

    estadoTexto: "Arrendada",

    titulo: "Departamento Amoblado con Vista al Mar en Reñaca",

    ubicacion: "Reñaca · Viña del Mar",

    precio: "$500.000",

    imagen: "propiedades/3/1.jpg",

    enlace: "propiedad.html?id=3",

    caracteristicas: [
      "🛏 1 dormitorio",
      "🚿 1 baño",
      "📐 52 m²",
      "🚗 1 estacionamiento",
      "📦 1 bodega",
      "🌅 Vista al mar"
    ]
  }

];



/* =====================================================
   CREAR TARJETAS
===================================================== */

function cargarPropiedades() {

  const contenedor =
    document.querySelector(".property-grid");

  if (!contenedor) {
    return;
  }


  /*
    Eliminamos las tarjetas escritas
    manualmente en index.html.
  */

  contenedor.innerHTML = "";


  /*
    Solo mostramos propiedades
    que tengan publicada: true
  */

  const propiedadesPublicadas =
    propiedades.filter(
      propiedad => propiedad.publicada === true
    );


  propiedadesPublicadas.forEach(
    propiedad => {

      const tarjeta =
        document.createElement("article");

      tarjeta.className =
        "property-card";


      tarjeta.dataset.operation =
        propiedad.operacion;


      tarjeta.dataset.status =
        propiedad.estado;


      let claseEstado =
        "status-arrendada";


      if (
        propiedad.estado === "disponible"
      ) {

        claseEstado =
          "status-disponible";

      }


      if (
        propiedad.estado === "vendida"
      ) {

        claseEstado =
          "status-vendida";

      }


      const caracteristicas =
        propiedad.caracteristicas
          .map(
            caracteristica =>
              `<span>${caracteristica}</span>`
          )
          .join("");


      tarjeta.innerHTML = `

        <div class="property-image">

          <span class="status ${claseEstado}">
            ${propiedad.estadoTexto}
          </span>

          <img
            src="${propiedad.imagen}"
            alt="${propiedad.titulo}"
            loading="lazy"
          >

        </div>


        <div class="property-content">

          <div class="operation">
            ${propiedad.operacion}
          </div>


          <h3>
            ${propiedad.titulo}
          </h3>


          <div class="location">
            ${propiedad.ubicacion}
          </div>


          <div class="price">
            ${propiedad.precio}
          </div>


          <div class="features">

            ${caracteristicas}

          </div>


          <a
            href="${propiedad.enlace}"
            class="property-button"
          >
            Ver propiedad
          </a>

        </div>

      `;


      contenedor.appendChild(tarjeta);

    }
  );

}



/* =====================================================
   FILTROS
===================================================== */

function filtrar(
  tipo,
  boton
) {

  const tarjetas =
    document.querySelectorAll(
      ".property-card"
    );


  const botones =
    document.querySelectorAll(
      ".filter"
    );


  botones.forEach(
    function(b) {

      b.classList.remove(
        "active"
      );

    }
  );


  if (boton) {

    boton.classList.add(
      "active"
    );

  }


  tarjetas.forEach(
    function(tarjeta) {

      const operacion =
        tarjeta.dataset.operation;


      const estado =
        tarjeta.dataset.status;


      let mostrar = false;


      if (
        tipo === "todas"
      ) {

        mostrar = true;

      }


      if (
        tipo === "venta" &&
        operacion === "venta"
      ) {

        mostrar = true;

      }


      if (
        tipo === "arriendo" &&
        operacion === "arriendo"
      ) {

        mostrar = true;

      }


      if (
        tipo === "disponible" &&
        estado === "disponible"
      ) {

        mostrar = true;

      }


      if (
        tipo === "gestionada" &&
        estado === "gestionada"
      ) {

        mostrar = true;

      }


      tarjeta.classList.toggle(
        "hidden",
        !mostrar
      );

    }
  );

}



/* =====================================================
   INICIAR
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    cargarPropiedades();

  }
);
