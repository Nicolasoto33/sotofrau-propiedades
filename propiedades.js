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


  /*
    MOSTRAR SOLO LAS PROPIEDADES PUBLICADAS

    ORDEN:
    1. Disponibles
    2. Gestionadas / Arrendadas / Vendidas
    3. ID más alto primero
  */

  const propiedadesPublicadas =
    propiedades
      .filter(
        function(propiedad) {

          return propiedad.publicada === true;

        }
      )
      .sort(
        function(a, b) {

          const prioridadA =
            a.estado === "disponible"
              ? 0
              : 1;


          const prioridadB =
            b.estado === "disponible"
              ? 0
              : 1;


          if (
            prioridadA !== prioridadB
          ) {

            return prioridadA -
              prioridadB;

          }


          return b.id -
            a.id;

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
        Array.isArray(
          propiedad.caracteristicas
        )
          ? propiedad.caracteristicas
              .map(
                function(caracteristica) {

                  return `
                    <span>
                      ${caracteristica}
                    </span>
                  `;

                }
              )
              .join("")
          : "";


      const enlace =
        "propiedad.html?id=" +
        propiedad.id;


      const textoEnlace =
        propiedad.estado === "disponible"
          ? "Ver propiedad disponible"
          : "Ver propiedad gestionada";


      tarjeta.innerHTML = `

        <div class="property-image">

          <span
            class="status ${claseEstado}"
          >
            ${propiedad.estadoTexto}
          </span>


          <img
            src="${propiedad.fotos[0]}"
            alt="${propiedad.titulo} en ${propiedad.ubicacion}"
            loading="lazy"
            decoding="async"
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
            aria-label="${textoEnlace}: ${propiedad.titulo} — ${propiedad.ubicacion}"
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
