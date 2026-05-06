fetch('data/contenido.json')
  .then(r => r.json())
  .then(data => {

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
      <div class="row mb-3">
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
        <li class="${c.titulo === 'Técnico/a Medio TIC (turno libre 2026)' ? 'plazo-destacado' : ''}"><strong>Plazo:</strong> ${c.plazo || '-'}</li>
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
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${d.cuerpo}</td>
        <td>${d.tipo}</td>
        <td>
          <a href="${d.url}" class="link-primary">
            ${d.texto}
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
