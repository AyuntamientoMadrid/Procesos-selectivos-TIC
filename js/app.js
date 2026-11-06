fetch('data/contenido.json')
  .then(r => r.json())
  .then(data => {

    pintarNovedades(data.novedades);
    pintarIntroduccion(data.introduccion);
    pintarItinerarios(data.itinerarios);

    pintarConvocatorias(
      'lista-abiertas',
      data.abiertas,
      'estado--abierta',
      'No hay convocatorias abiertas actualmente.'
    );

    pintarConvocatorias(
      'lista-desarrollo',
      data.desarrollo,
      'estado--desarrollo',
      'No hay procesos en desarrollo.'
    );

    pintarConvocatorias(
      'lista-finalizadas',
      data.finalizadas,
      'estado--finalizada',
      'No hay procesos finalizados.'
    );

    pintarDocumentacion(data.documentacion);
    pintarFAQ(data.faq);
  })
  .catch(err => console.error('Error cargando el contenido', err));

/* =========================
   NOVEDADES
   ========================= */
function pintarNovedades(novedades) {
  const banner = document.getElementById('banner-novedad');
  const bannerTexto = document.getElementById('banner-novedad-texto');
  const navItem = document.getElementById('nav-item-novedades');
  const navIndicador = document.getElementById('novedades-nav-indicador');
  const seccion = document.getElementById('novedades');
  const contReciente = document.getElementById('lista-novedades-reciente');
  const contAnteriores = document.getElementById('lista-novedades-anteriores');
  const contenedorAnteriores = document.getElementById('contenedor-novedades-anteriores');
  const toggleContainer = document.getElementById('novedades-toggle-container');
  const btnToggle = document.getElementById('btn-toggle-novedades');
  const btnToggleTexto = document.getElementById('btn-toggle-novedades-texto');

  // Filtrar solo las novedades activas
  const listaActivas = Array.isArray(novedades)
    ? novedades.filter(item => item && item.activa !== false)
    : [];

  // Si no hay novedades activas: ocultar banner, icono de cabecera y sección
  if (listaActivas.length === 0) {
    if (banner) banner.classList.add('d-none');
    if (navIndicador) navIndicador.classList.add('d-none');
    if (navItem) navItem.classList.add('d-none');
    if (seccion) seccion.classList.add('d-none');
    return;
  }

  // Hay novedades activas: mostrar elementos
  if (navItem) navItem.classList.remove('d-none');
  if (navIndicador) navIndicador.classList.remove('d-none');
  if (seccion) seccion.classList.remove('d-none');

  // 1. Banner superior con la novedad más reciente
  const ultima = listaActivas[0];
  if (banner && bannerTexto) {
    const procesoPrefijo = ultima.proceso ? `<strong>[${ultima.proceso}]</strong> ` : '';
    const fechaTexto = ultima.fecha ? ` <span class="text-secondary ms-1 small">(${ultima.fecha})</span>` : '';
    bannerTexto.innerHTML = `${procesoPrefijo}${ultima.titulo}${fechaTexto}`;
    banner.classList.remove('d-none');
  }

  // 2. Pintar únicamente la última novedad en la vista principal
  if (contReciente) {
    contReciente.innerHTML = generarHTMLNovedad(ultima, true);
  }

  // 3. Pintar novedades anteriores y gestionar el botón desplegable
  const anteriores = listaActivas.slice(1);
  if (anteriores.length > 0) {
    if (contAnteriores) {
      contAnteriores.innerHTML = anteriores.map(n => generarHTMLNovedad(n, false)).join('');
    }
    if (contenedorAnteriores) {
      contenedorAnteriores.classList.add('d-none');
    }
    if (toggleContainer && btnToggle && btnToggleTexto) {
      toggleContainer.classList.remove('d-none');
      btnToggle.setAttribute('aria-expanded', 'false');
      btnToggleTexto.textContent = `Ver novedades anteriores (${anteriores.length})`;

      btnToggle.onclick = function() {
        const estaOculto = contenedorAnteriores.classList.contains('d-none');
        if (estaOculto) {
          contenedorAnteriores.classList.remove('d-none');
          btnToggle.setAttribute('aria-expanded', 'true');
          btnToggle.innerHTML = `<i class="bi bi-chevron-up me-1" aria-hidden="true"></i> <span id="btn-toggle-novedades-texto">Ocultar novedades anteriores</span>`;
        } else {
          contenedorAnteriores.classList.add('d-none');
          btnToggle.setAttribute('aria-expanded', 'false');
          btnToggle.innerHTML = `<i class="bi bi-chevron-down me-1" aria-hidden="true"></i> <span id="btn-toggle-novedades-texto">Ver novedades anteriores (${anteriores.length})</span>`;
        }
      };
    }
  } else {
    if (toggleContainer) toggleContainer.classList.add('d-none');
    if (contenedorAnteriores) contenedorAnteriores.classList.add('d-none');
  }
}

function generarHTMLNovedad(item, esUltima) {
  let enlaceHTML = '';
  if (item.enlace && item.enlace.url) {
    const isExternal = item.enlace.url.startsWith('http');
    const isNewTab = isExternal || item.enlace.target === '_blank';
    const targetAttrs = isNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const ariaLabel = isNewTab ? ` aria-label="${item.enlace.texto || 'Ver información'} (se abre en una pestaña nueva)"` : '';
    const icon = isNewTab
      ? ' <i class="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true"></i>'
      : ' <i class="bi bi-arrow-right ms-1 small" aria-hidden="true"></i>';

    enlaceHTML = `
      <div class="novedad-item__accion">
        <a href="${item.enlace.url}" class="btn btn-sm btn-outline-madrid"${targetAttrs}${ariaLabel}>
          ${item.enlace.texto || 'Más información'}${icon}
        </a>
      </div>
    `;
  }

  const fechaHTML = item.fecha
    ? `<time class="novedad-fecha" datetime="${item.fecha_iso || item.fecha}">
         <i class="bi bi-calendar3 me-1" aria-hidden="true"></i> ${item.fecha}
       </time>`
    : '';

  const procesoHTML = item.proceso
    ? `<span class="badge badge-proceso">${item.proceso}</span>`
    : '';

  const categoriaHTML = item.categoria
    ? `<span class="badge bg-light text-secondary border">${item.categoria}</span>`
    : '';

  const badgeReciente = esUltima
    ? `<span class="badge bg-success-subtle text-success border border-success-subtle">
         <i class="bi bi-stars me-1" aria-hidden="true"></i>Más reciente
       </span>`
    : '';

  return `
    <article class="novedad-item ${esUltima ? 'novedad-item--reciente' : ''}">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-2">
        ${fechaHTML}
        ${procesoHTML}
        ${categoriaHTML}
        ${badgeReciente}
      </div>
      <h3 class="novedad-item__titulo">${item.titulo}</h3>
      ${item.descripcion ? `<p class="novedad-item__texto">${item.descripcion}</p>` : ''}
      ${enlaceHTML}
    </article>
  `;
}

/* =========================
   INTRODUCCIÓN
   ========================= */
function pintarIntroduccion(introduccion) {
  const titulo = document.getElementById('intro-titulo');
  const texto = document.getElementById('intro-texto');
  const textoFinal = document.getElementById('intro-final');

  if (introduccion) {
    if (titulo) titulo.textContent = introduccion.titulo;
    if (texto) texto.innerHTML = introduccion.texto;
    if (textoFinal) textoFinal.innerHTML = introduccion.texto_final;
  }
}

/* =========================
   ITINERARIOS
   ========================= */
function pintarItinerarios(itinerarios) {
  const container = document.getElementById('itinerarios-container');
  container.innerHTML = '';

  if (!itinerarios || itinerarios.length === 0) {
    container.innerHTML = '<p class="mensaje-informativo">No hay itinerarios disponibles.</p>';
    return;
  }

  itinerarios.forEach((it, index) => {
    const descId = `itinerario-${it.id}-desc`;
    container.insertAdjacentHTML('beforeend', `
      <div class="col-12 col-md-6 col-lg-3">
        <article class="itinerario h-100">
          <button type="button" class="itinerario__imagen" data-target="${descId}" aria-expanded="false" aria-controls="${descId}">
            <img src="${it.imagen}" alt="${it.alt}">
          </button>
          <h3>${it.titulo}</h3>
          <div class="itinerario__descripcion d-none" id="${descId}">
            ${it.descripcion}
          </div>
        </article>
      </div>
    `);
  });

  agregarEventosItinerarios();
}

function agregarEventosItinerarios() {
  const botones = document.querySelectorAll('.itinerario__imagen');
  botones.forEach(boton => {
    boton.addEventListener('click', function() {
      // Mostrar todas las descripciones
      const todasLasDescripciones = document.querySelectorAll('.itinerario__descripcion');
      todasLasDescripciones.forEach(desc => {
        desc.classList.remove('d-none');
      });
      
      // Actualizar el estado aria-expanded de todos los botones
      botones.forEach(b => {
        b.setAttribute('aria-expanded', 'true');
      });
    });
  });
}

/* =========================
   CONVOCATORIAS
   ========================= */
function dividirTitulo(titulo) {
  const match = titulo.match(/^(.+?)\s*\((.+)\)$/);
  if (match) {
    return {
      principal: match[1].trim(),
      secundario: `(${match[2]})`
    };
  }
  return {
    principal: titulo,
    secundario: ''
  };
}

function pintarConvocatorias(id, lista, estado, mensajeVacio) {
  const cont = document.getElementById(id);
  cont.innerHTML = '';

  if (!lista || lista.length === 0) {
    cont.innerHTML = `
    <p class="mensaje-informativo">
      ℹ ${mensajeVacio}
    </p>`;
    return;
  }

  lista.forEach(c => {
    const tituloDividido = dividirTitulo(c.titulo);
    cont.insertAdjacentHTML('beforeend', `
      <div class="row g-2 mb-3 align-items-center">
      <div class="col-md-4">
      <div class="card card-convocatoria border-0">
      <div class="card-body">
        <h5 class="card-title ${estado}">
        <span class="text-white">${tituloDividido.principal}</span>
        ${tituloDividido.secundario ? `<br><small class="text-white">${tituloDividido.secundario}</small>` : ''}
        </h5>
      </div>
      </div>
      </div>
      <div class="col-md-4">
      <div class="card card-convocatoria border-0">
      <div class="card-body">
        <ul class="tarjeta__meta">
        <li><strong>Plazas:</strong> ${c.plazas || '-'}</li>
        ${c.cupo_discapacidad
        ? `<li><strong>Cupo de discapacidad:</strong> ${c.cupo_discapacidad}</li>`
        : ''}
        <li class="${c.plazo_destacado ? 'plazo-destacado' : ''}"><strong>Plazo:</strong> ${c.plazo || '-'}</li>
        </ul>
      </div>
      </div>
      </div>
      <div class="col-md-4">
      <div class="card card-convocatoria border-0">
      <div class="card-body">
        ${c.url
      ? `<a href="${c.url}"
         class="btn-madrid btn"
         target="_blank"
         rel="noopener noreferrer"
         aria-label="Ver convocatoria (se abre en una pestaña nueva)">
         Ver convocatoria <i class="bi bi-box-arrow-up-right ms-2" aria-hidden="true"></i>
         </a>`
      : ''}
      </div>
      </div>
      </div>
      </div>
    `);
  });
}

/* =========================
   DOCUMENTACIÓN
   ========================= */
function pintarDocumentacion(lista) {
  const tbody = document.getElementById('tabla-documentacion');
  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">
          No hay documentación disponible.
        </td>
      </tr>`;
    return;
  }

  lista.forEach(d => {
    const isNewTab = d.target === '_blank' || (d.url && d.url.includes('simulador'));
    const targetAttrs = isNewTab ? ' target="_blank" rel="noopener noreferrer"' : '';
    const ariaLabel = isNewTab ? ` aria-label="${d.texto} (se abre en una pestaña nueva)"` : '';
    const icon = isNewTab ? ' <i class="bi bi-box-arrow-up-right ms-1 small" aria-hidden="true"></i>' : '';

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${d.cuerpo}</td>
        <td>${d.tipo}</td>
        <td>
          <a href="${d.url}" class="link-primary"${targetAttrs}${ariaLabel}>
            ${d.texto}${icon}
          </a>
        </td>
      </tr>
    `);
  });
}

/* =========================
   FAQ
   ========================= */
function pintarFAQ(lista) {
  const tbody = document.getElementById('tabla-faq');
  tbody.innerHTML = '';

  if (!lista || lista.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="2" class="text-center">
          No hay documentos disponibles.
        </td>
      </tr>`;
    return;
  }

  lista.forEach(f => {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${f.texto}</td>
        <td>
          <a href="${f.url}" class="link-primary">
            Descargar
          </a>
        </td>
      </tr>
    `);
  });
}

function activarItinerarios() {
  const botones = document.querySelectorAll('.itinerario__imagen');

  botones.forEach(boton => {
    boton.addEventListener('click', () => {
      const descripciones = document.querySelectorAll('.itinerario__descripcion');
      descripciones.forEach(descripcion => {
        descripcion.classList.remove('d-none');
      });
      botones.forEach(btn => {
        btn.setAttribute('aria-expanded', 'true');
      });
    });
  });
}

activarItinerarios();
