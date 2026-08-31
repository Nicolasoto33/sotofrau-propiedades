const propiedades = [

  /* =====================================================
     PROPIEDAD 1
  ===================================================== */

  {
    id: 1,

    publicada: true,

    operacion: "Arriendo",

    estado: "gestionada",

    estadoTexto: "Arrendada",

    titulo: "Habitación en arriendo",

    direccion: "",

    ubicacion: "Valparaíso · Sector Yungay",

    precio: "$260.000",

    gastosComunes: "",

    totalMensual: "",

    fotos: [
      "propiedades/1/1.jpeg"
    ],

    caracteristicas: [
      "🛏 1 dormitorio",
      "🚿 1 baño",
      "📐 72 m²",
      "🛋 Amoblado"
    ],

    descripcion: [
      "Habitación en arriendo ubicada en el sector Yungay de Valparaíso.",
      "Para conocer disponibilidad, condiciones y coordinar una visita, puedes contactarnos directamente."
    ],

    informacionImportante: [
      "1 dormitorio",
      "1 baño",
      "72 m²",
      "Amoblado"
    ],

    areasComunes: [],

    conectividad: [],

    whatsapp:
      "Hola, me gustaría consultar por la habitación en arriendo en Valparaíso, sector Yungay."
  },


  /* =====================================================
     PROPIEDAD 2
  ===================================================== */

  {
    id: 2,

    publicada: true,

    operacion: "Arriendo",

    estado: "gestionada",

    estadoTexto: "Arrendada",

    titulo: "2° Piso Independiente en Arriendo",

    direccion: "Teniente Serrano",

    ubicacion: "Quilpué · Sector Teniente Serrano",

    precio: "$400.000",

    gastosComunes: "Sin gastos comunes",

    totalMensual: "$400.000",

    fotos: [
      "propiedades/2/1.jpeg"
    ],

    caracteristicas: [
      "🛏 2 dormitorios",
      "🚿 1 baño",
      "📐 45 m²",
      "🚗 1 estacionamiento",
      "🍳 Cocina amoblada",
      "🌿 Patio"
    ],

    descripcion: [
      "Se arrienda segundo piso independiente de una casa, ubicado en el sector de Teniente Serrano, Quilpué.",
      "La propiedad cuenta con dos habitaciones, un baño, living-comedor amplio y cocina amoblada.",
      "Además, dispone de logia techada, patio abierto y derecho a patio, junto con estacionamiento para un vehículo.",
      "La propiedad no tiene gastos comunes. Los servicios básicos se dividen entre los residentes.",
      "Cuenta con locomoción a la puerta y se encuentra cerca de supermercados y a pocos minutos del centro de Quilpué."
    ],

    informacionImportante: [
      "2 dormitorios",
      "1 baño",
      "45 m²",
      "1 estacionamiento",
      "Cocina amoblada",
      "Patio",
      "Sin gastos comunes",
      "Servicios básicos divididos"
    ],

    areasComunes: [],

    conectividad: [
      "Locomoción a la puerta",
      "Cercano a supermercados",
      "A pocos minutos del centro de Quilpué"
    ],

    whatsapp:
      "Hola, me gustaría consultar por el 2° piso independiente en arriendo en Teniente Serrano, Quilpué."
  },


  /* =====================================================
     PROPIEDAD 3
  ===================================================== */

  {
    id: 3,

    publicada: true,

    operacion: "Arriendo",

    estado: "gestionada",

    estadoTexto: "Arrendada",

    titulo: "Departamento Amoblado con Vista al Mar en Reñaca",

    direccion: "Las Golondrinas 1731",

    ubicacion: "Reñaca · Viña del Mar",

    precio: "$500.000",

    gastosComunes: "$70.000",

    totalMensual: "$570.000",

    fotos: [
      "propiedades/3/1.jpg",
      "propiedades/3/2.jpg",
      "propiedades/3/3.jpg",
      "propiedades/3/4.jpg",
      "propiedades/3/5.jpg",
      "propiedades/3/6.jpg",
      "propiedades/3/7.jpg"
    ],

    caracteristicas: [
      "🛏 1 dormitorio",
      "🚿 1 baño",
      "🏢 Piso 13",
      "🌅 Vista al mar",
      "🚗 1 estacionamiento",
      "📦 1 bodega"
    ],

    descripcion: [
      "Departamento amoblado con vista al mar ubicado en Las Golondrinas 1731, Reñaca, Viña del Mar. Se encuentra en el piso 13 y cuenta con orientación poniente, ofreciendo una excelente vista hacia el mar.",

      "La propiedad dispone de 1 dormitorio, 1 baño, living y una terraza con vista al mar. Cuenta además con cocina de concepto abierto con comedor incorporado.",

      "El departamento se entrega amoblado y dispone de 1 estacionamiento y 1 bodega.",

      "El canon de arriendo es de $500.000 mensuales. Los gastos comunes corresponden a $70.000, alcanzando un total mensual de $570.000.",

      "El edificio cuenta con piscina exterior, piscina temperada, gimnasio, quinchos, sala de juegos, sala de estar para niños y conserjería 24/7.",

      "Excelente conectividad, a media cuadra de la locomoción colectiva y cercano a bancos, farmacias, supermercados, colegios, centros médicos y restaurantes."
    ],

    informacionImportante: [
      "Arriendo mensual: $500.000",
      "Gastos comunes: $70.000",
      "Total mensual: $570.000",
      "Piso 13 · Orientación poniente",
      "1 dormitorio y 1 baño",
      "Departamento amoblado",
      "Terraza con vista al mar",
      "1 estacionamiento y 1 bodega"
    ],

    areasComunes: [
      "🏊 Piscina exterior",
      "♨️ Piscina temperada",
      "🏋️ Gimnasio",
      "🍖 Quinchos",
      "🎮 Sala de juegos",
      "🧸 Sala de estar para niños",
      "🛡️ Conserjería 24/7"
    ],

    conectividad: [
      "Locomoción colectiva a media cuadra",
      "Cercano a supermercados",
      "Cercano a farmacias y bancos",
      "Cercano a colegios",
      "Cercano a centros médicos",
      "Cercano a restaurantes"
    ],

    whatsapp:
      "Hola, me gustaría consultar por el departamento amoblado con vista al mar en Reñaca, Las Golondrinas 1731."
  }

];



/* =====================================================
   GENERAR TARJETAS EN INICIO
===================================================== */

function cargarPropiedades() {

  const contenedor =
    document.getElementById(
      "propertyGrid"
    );

  if (!contenedor) {

    return;

  }


  contenedor.innerHTML = "";


  const propiedadesPublicadas =
    propiedades.filter(
      function(propiedad) {

        return propiedad.publicada === true;

      }
    );


  propiedadesPublicadas.forEach(
    function(propiedad) {

      const tarjeta =
        document.createElement(
          "article"
        );


      tarjeta.className =
        "property-card";


      tarjeta.dataset.operation =
        propiedad.operacion.toLowerCase();


      tarjeta.dataset.status =
        propiedad.estado.toLowerCase();


      let claseEstado =
        "status-arrendada";


      if (
        propiedad.estado.toLowerCase() ===
        "disponible"
      ) {

        claseEstado =
          "status-disponible";

      }


      if (
        propiedad.estado.toLowerCase() ===
        "vendida"
      ) {

        claseEstado =
          "status-vendida";

      }


      const caracteristicas =
        propiedad.caracteristicas
          .map(
            function(caracteristica) {

              return `
                <span>
                  ${caracteristica}
                </span>
              `;

            }
          )
          .join("");


      const enlace =
        "propiedad.html?id=" +
        propiedad.id;


      tarjeta.innerHTML = `

        <div class="property-image">

          <span
            class="status ${claseEstado}"
          >
            ${propiedad.estadoTexto}
          </span>


          <img
            src="${propiedad.fotos[0]}"
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
            href="${enlace}"
            class="property-button"
          >
            Ver propiedad
          </a>

        </div>

      `;


      contenedor.appendChild(
        tarjeta
      );

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


      let mostrar =
        false;


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
   INICIAR SISTEMA
===================================================== */

document.addEventListener(
  "DOMContentLoaded",
  function() {

    cargarPropiedades();

  }
);
