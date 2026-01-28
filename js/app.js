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
            'lista-proximas',
            data.proximas,
            'estado--proxima',
            'No hay convocatorias próximas previstas.'
        );

        pintarConvocatorias(
            'lista-finalizadas',
            data.finalizadas,
            'estado--finalizada',
            'No hay convocatorias finalizadas.'
        );

        pintarDocumentacion(data.documentacion);
        pintarFAQ(data.faq);
    })
    .catch(err => console.error('Error cargando el contenido', err));

/* =========================
   CONVOCATORIAS (tarjetas)
   ========================= */
function pintarConvocatorias(id, lista, estado, mensajeVacio) {
    const cont = document.getElementById(id);
    cont.innerHTML = '';

    if (!lista || lista.length === 0) {
        cont.innerHTML = `
      <div class="card card-convocatoria mx-auto">
        <div class="card-body">
          <h5 class="card-title ${estado}">
            <span class="text-white">${mensajeVacio}</span>
          </h5>
        </div>
      </div>`;
        return;
    }

    lista.forEach(c => {
        cont.insertAdjacentHTML('beforeend', `
      <div class="card card-convocatoria mx-auto">
        <div class="card-body">
          <h5 class="card-title ${estado}">
            <span class="text-white">${c.titulo}</span>
          </h5>
            <ul class="tarjeta__meta">
            <li><strong>Plazas:</strong> ${c.plazas || '-'}</li>

            ${c.cupo_discapacidadd
                            ? `<li><strong>Cupo de discapacidad:</strong> ${c.cupo_discapacidad}</li>`
                            : ''}

            <li><strong>Plazo:</strong> ${c.plazo || '-'}</li>
            </ul>
          <a href="${c.url}" class="btn-madrid btn" target="_blank" rel="noopener noreferrer">Ver convocatoria<i class="bi bi-box-arrow-up-right ms-1"></i></a>
        </div>
      </div>
    `);
    });
}

/* =========================
   DOCUMENTACIÓN (tabla 3 col)
   ========================= */
function pintarDocumentacion(lista) {
    const tbody = document.getElementById('tabla-documentacion');
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="3" class="text-center">No hay documentación disponible.</td>
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
   FAQ (tabla 2 col)
   ========================= */
function pintarFAQ(lista) {
    const tbody = document.getElementById('tabla-faq');
    tbody.innerHTML = '';

    if (!lista || lista.length === 0) {
        tbody.innerHTML = `
      <tr>
        <td colspan="2" class="text-center">No hay documentos disponibles.</td>
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
