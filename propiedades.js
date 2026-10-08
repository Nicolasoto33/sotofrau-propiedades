/* =====================================================
   SOTOFRAU PROPIEDADES
   LÓGICA DE PROPIEDADES
===================================================== */


/* =====================================================
   VALOR UF
===================================================== */

/*
  Se consulta una sola vez el valor vigente de la UF.

  Si la consulta falla:
  - las propiedades siguen funcionando normalmente
  - simplemente no se muestra la conversión
*/

let promesaValorUF = null;


function obtenerValorUF() {

  if (promesaValorUF) {
    return promesaValorUF;
  }


  promesaValorUF = fetch(
    "https://mindicador.cl/api/uf"
  )
    .then(
      function(respuesta) {

        if (!respuesta.ok) {
          throw new Error(
            "No fue posible obtener el valor de la UF."
          );
        }

        return respuesta.json();

      }
    )
    .then(
      function(datos) {

        if (
          !datos ||
          !Array.isArray(datos.serie) ||
          datos.serie.length === 0 ||
          !datos.serie[0].valor
        ) {

          throw new Error(
            "El valor de la UF no está disponible."
          );

        }


        return Number(
          datos.serie[0].valor
        );

      }
    )
    .catch(
      function(error) {

        console.warn(
          "Conversión UF/CLP no disponible:",
          error
        );

        return null;

      }
    );


  return promesaValorUF;

}



/* =====================================================
   FORMATEAR CLP
===================================================== */

function formatearCLP(valor) {

  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0
    }
  ).format(
    Math.round(valor)
  );

}



/* =====================================================
   FORMATEAR UF
===================================================== */

function formatearUF(valor) {

  return new Intl.NumberFormat(
    "es-CL",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }
  ).format(valor);

}



/* =====================================================
   OBTENER NÚMERO DESDE PRECIO UF
===================================================== */

function obtenerNumeroUF(precio) {

  const texto =
    String(
      precio || ""
    )
      .toUpperCase()
      .trim();


  if (
    !texto.includes("UF")
  ) {

    return null;

  }


  const coincidencia =
    texto.match(
      /([\d.]+(?:,\d+)?)\s*UF/i
    );


  if (!coincidencia) {

    const coincidenciaInvertida =
      texto.match(
        /UF\s*([\d.]+(?:,\d+)?)/i
      );


    if (!coincidenciaInvertida) {
      return null;
    }


    const numero =
      coincidenciaInvertida[1]
        .replace(/\./g, "")
        .replace(",", ".");


    const valor =
      Number(numero);


    return Number.isNaN(valor)
      ? null
      : valor;

  }


  const numero =
    coincidencia[1]
      .replace(/\./g, "")
      .replace(",", ".");


  const valor =
    Number(numero);


  return Number.isNaN(valor)
    ? null
    : valor;

}



/* =====================================================
   OBTENER NÚMERO DESDE PRECIO CLP
===================================================== */

function obtenerNumeroCLP(precio) {

  const texto =
    String(
      precio || ""
    )
      .trim();


  if (
    texto.toUpperCase().includes("UF")
  ) {

    return null;

  }


  const coincidencia =
    texto.match(
      /\$?\s*([\d.]+)/
    );


  if (!coincidencia) {
    return null;
  }


  const numero =
    coincidencia[1]
      .replace(/\./g, "");


  const valor =
    Number(numero);


  return Number.isNaN(valor)
    ? null
    : valor;

}



/* =====================================================
   GENERAR CONVERSIÓN PARA VENTA
===================================================== */

async function obtenerConversionPrecio(
  propiedad
) {

  /*
    SOLO SE MUESTRA EN VENTAS
  */

  if (
    !propiedad ||
    String(
      propiedad.operacion || ""
    ).toLowerCase() !== "venta"
  ) {

    return "";

  }


  const valorUF =
    await obtenerValorUF();


  if (
    !valorUF ||
    valorUF <= 0
  ) {

    return "";

  }


  const precioTexto =
    String(
      propiedad.precio || ""
    );


  /*
    PRECIO ORIGINAL EN UF
    → CONVERTIR A CLP
  */

  if (
    precioTexto
      .toUpperCase()
      .includes("UF")
  ) {

    const cantidadUF =
      obtenerNumeroUF(
        precioTexto
      );


    if (
      cantidadUF === null
    ) {

      return "";

    }


    const valorCLP =
      cantidadUF *
      valorUF;


    return (
      "≈ " +
      formatearCLP(
        valorCLP
      )
    );

  }


  /*
    PRECIO ORIGINAL EN CLP
    → CONVERTIR A UF
  */

  const cantidadCLP =
    obtenerNumeroCLP(
      precioTexto
    );


  if (
    cantidadCLP === null
  ) {

    return "";

  }


  const cantidadUF =
    cantidadCLP /
    valorUF;


  return (
    "≈ " +
    formatearUF(
      cantidadUF
    ) +
    " UF"
  );

}



/* =====================================================
   MOSTRAR CONVERSIÓN EN TARJETA
===================================================== */

function cargarConversionTarjeta(
  propiedad,
  tarjeta
) {

  if (
    !propiedad ||
    String(
      propiedad.operacion || ""
    ).toLowerCase() !== "venta"
  ) {

    return;

  }


  const contenedorConversion =
    tarjeta.querySelector(
      ".price-conversion"
    );


  if (
    !contenedorConversion
  ) {

    return;

  }


  obtenerConversionPrecio(
    propiedad
  ).then(
    function(texto) {

      if (!texto) {

        contenedorConversion.style.display =
          "none";

        return;

      }


      contenedorConversion.textContent =
        texto;


      contenedorConversion.style.display =
        "block";

    }
  );

}



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


      /* =================================================
         URL SOCIAL AUTOMÁTICA

         Cada propiedad recibe su propia versión.
         Ya no usamos ?v=2 de manera fija.
      ================================================= */

      const versionSocial =
        propiedad.versionSocial ||
        String(
          propiedad.id
        );


      const enlace =
        "/propiedad/" +
        propiedad.id +
        "/?v=" +
        encodeURIComponent(
          versionSocial
        );


      const textoEnlace =
        propiedad.estado === "disponible"
          ? "Ver propiedad disponible"
          : "Ver propiedad gestionada";


      /*
        IMAGEN PRINCIPAL

        1. Usa la imagen principal seleccionada
           en el panel administrativo.

        2. Si no existe, utiliza la primera
           fotografía de la galería.

        3. Si tampoco existe una fotografía,
           utiliza una imagen de respaldo.
      */

      let imagenPrincipal =
        "/android-chrome-512x512.png";


      if (
        propiedad.imagen
      ) {

        imagenPrincipal =
          propiedad.imagen;

      } else if (
        Array.isArray(
          propiedad.fotos
        ) &&
        propiedad.fotos.length > 0
      ) {

        imagenPrincipal =
          propiedad.fotos[0];

      }


      /*
        La conversión queda inicialmente oculta.

        Solo se mostrará si:
        - la operación es Venta
        - se obtiene correctamente el valor UF
      */

      const mostrarEspacioConversion =
        String(
          propiedad.operacion || ""
        ).toLowerCase() === "venta";


      const bloqueConversion =
        mostrarEspacioConversion
          ? `
            <div
              class="price-conversion"
              style="
                display:none;
                margin-top:4px;
                margin-bottom:2px;
                color:#6b7781;
                font-size:13px;
                font-weight:600;
                line-height:1.3;
              "
            ></div>
          `
          : "";


      tarjeta.innerHTML = `

        <div class="property-image">

          <span
            class="status ${claseEstado}"
          >
            ${propiedad.estadoTexto}
          </span>


          <img
            src="${imagenPrincipal}"
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


          ${bloqueConversion}


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


      /*
        CARGAR CONVERSIÓN
        SOLO PARA VENTAS
      */

      cargarConversionTarjeta(
        propiedad,
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
