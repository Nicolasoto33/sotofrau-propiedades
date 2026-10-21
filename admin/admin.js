(function () {
  'use strict';
  const CMS = window.CMS, h = window.h, createClass = window.createClass, U = window.SotofrauGallery;
  if (!CMS || !h || !createClass || !U) {
    document.querySelector('#admin-loading p').textContent = 'No se pudo cargar el panel. Revisa tu conexión y vuelve a cargar la página.';
    return;
  }
  let uploadsInProgress = 0;
  const uploadIds = new Map();
  function data(props) { return props.entry.get('data').toJS(); }
  function asset(props, path, field) {
    // A leading slash bypasses Decap's draft asset cache in 3.15.1.
    // Resolve this property's files through that cache; preserve legacy/external paths.
    const prefix = '/propiedades/' + data(props).id + '/';
    const lookup = typeof path === 'string' && path.startsWith(prefix) ? path.slice(prefix.length) : path;
    return props.getAsset(lookup, field);
  }
  function image(props, path, alt, extra) {
    return path ? h('img', Object.assign({ src: String(asset(props, path, props.field)), alt, loading: 'lazy', decoding: 'async' }, extra)) : null;
  }
  function button(text, action, disabled, extra) {
    return h('button', Object.assign({ type: 'button', onClick: action, disabled: !!disabled }, extra), text);
  }
  const Gallery = createClass({
    getInitialState() { return { busy: false, progress: '', errors: [], removed: null }; },
    shouldComponentUpdate() { return true; },
    componentDidMount() { this.alive = true; this.controlID = 'sf-gallery-' + crypto.randomUUID(); },
    componentWillUnmount() { this.alive = false; this.cancelled = true; this.props.onRemoveMediaControl(this.controlID); },
    componentDidUpdate() {
      const selected = this.props.mediaPaths.get(this.controlID);
      if (selected) {
        this.props.onRemoveInsertedMedia(this.controlID);
        const current = U.list(this.props.value);
        const additions = typeof selected === 'string' ? [selected] : U.list(selected);
        this.props.onChange(current.concat(additions.filter(path => !current.includes(path))));
      }
    },
    controlID: null,
    isValid() { return this.state.busy ? { error: { message: 'Espera a que termine la preparación de las fotografías.' } } : { error: false }; },
    async upload(event) {
      const files = Array.from(event.target.files || []);
      event.target.value = '';
      if (!files.length || this.busy) return;
      const id = data(this.props).id;
      if (!U.validId(id)) { this.setState({ errors: ['Completa primero un ID entero mayor que cero.'] }); return; }
      this.busy = true; this.cancelled = false; uploadsInProgress++;
      this.setState({ busy: true, errors: [], removed: null });
      const errors = [];
      let count = 0;
      // Sequential processing preserves the FileList order and bounds memory usage.
      try {
        for (let index = 0; index < files.length; index++) {
          if (this.cancelled || !this.alive) break;
          if (String(data(this.props).id) !== String(id)) { errors.push('Cambió el ID: se detuvo la carga. Restablece el ID original.'); break; }
          const file = files[index];
          const invalid = U.checkFile(file);
          if (invalid) { errors.push(file.name + ': ' + invalid); continue; }
          this.setState({ progress: 'Preparando ' + (index + 1) + ' de ' + files.length + ': ' + file.name });
          try {
            // Decap keys draft files by SHA-256, not filename. Reuse identical files
            // instead of replacing a draft asset still referenced by another photo.
            const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
            const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
            const existing = this.props.entry.get('mediaFiles')?.find(item => item.get('id') === hash);
            if (existing) {
              const existingPath = '/' + existing.get('path').replace(/^\/+/, '');
              if (!U.list(this.props.value).includes(existingPath)) this.props.onChange(U.list(this.props.value).concat(existingPath));
              else errors.push(file.name + ': esta fotografía ya está en la galería; se omitió el duplicado.');
              continue;
            }
            if (!this.alive || this.cancelled) break;
            if (String(data(this.props).id) !== String(id)) throw new Error('Cambió el ID. Restáuralo antes de continuar.');
            const renamed = new File([file], U.filename(file.name, crypto.randomUUID()), { type: file.type, lastModified: file.lastModified });
            // Decap 3.15.1 widget hook: queues the asset in entryDraft, using collection media_folder.
            const result = await this.props.onPersistMedia(renamed, { field: this.props.field });
            const path = U.uploadedPath(result, id);
            if (!this.alive) break;
            uploadIds.set(path, String(id));
            this.props.onChange(U.list(this.props.value).concat(path));
            count++;
          } catch (error) { errors.push(file.name + ': ' + error.message); }
        }
      } finally {
        uploadsInProgress--; this.busy = false;
        if (this.alive) this.setState({ busy: false, errors, progress: count + ' foto(s) agregada(s). Guarda el borrador para conservarlas.' });
      }
    },
    openLibrary() {
      this.props.onOpenMediaLibrary({ controlID: this.controlID, forImage: true, allowMultiple: false, value: '', field: this.props.field });
    },
    render() {
      const items = U.list(this.props.value), id = data(this.props).id;
      return h('div', { className: this.props.classNameWrapper + ' sf-gallery', id: this.props.forID },
        h('div', { className: 'sf-actions' },
          h('label', { className: 'sf-upload', 'aria-disabled': this.state.busy || !U.validId(id) }, 'Seleccionar varias fotos',
            h('input', { type: 'file', multiple: true, accept: '.jpg,.jpeg,.png,.webp,.avif', onChange: this.upload, disabled: this.state.busy || !U.validId(id), 'aria-label': 'Seleccionar varias fotos' })),
          button('Elegir foto existente', this.openLibrary, this.state.busy || !U.validId(id)),
          this.state.busy ? button('Detener después de esta foto', () => { this.cancelled = true; }) : null),
        h('p', { className: 'sf-help' }, U.validId(id) ? 'Carpeta: /propiedades/' + id + '/ · JPG, PNG, WebP o AVIF · Hasta 15 MB por foto. Se conserva el orden entregado por tu dispositivo; puedes ajustarlo abajo.' : 'Completa el ID antes de seleccionar fotografías.'),
        h('p', { role: 'status', 'aria-live': 'polite' }, this.state.progress || items.length + ' fotografías en la galería'),
        this.state.errors.length ? h('ul', { role: 'alert', className: 'sf-errors' }, this.state.errors.map((error, i) => h('li', { key: i }, error))) : null,
        h('div', { className: 'sf-photo-grid' }, items.map((path, index) => h('div', { className: 'sf-photo', key: path + index },
          image(this.props, path, 'Foto ' + (index + 1)),
          h('span', { className: 'sf-caption', title: path }, (index + 1) + '. ' + String(path).split('/').pop()),
          h('div', { className: 'sf-actions' },
            button('←', () => this.props.onChange(U.move(items, index, index - 1)), this.state.busy || index === 0, { 'aria-label': 'Mover foto ' + (index + 1) + ' antes' }),
            button('→', () => this.props.onChange(U.move(items, index, index + 1)), this.state.busy || index === items.length - 1, { 'aria-label': 'Mover foto ' + (index + 1) + ' después' }),
            button('Quitar', () => { this.setState({ removed: { path, index } }); this.props.onChange(items.filter((_, i) => i !== index)); }, this.state.busy, { 'aria-label': 'Quitar foto ' + (index + 1) }))))),
        this.state.removed ? button('Deshacer última eliminación', () => {
          const restored = U.list(this.props.value); restored.splice(this.state.removed.index, 0, this.state.removed.path);
          this.props.onChange(restored); this.setState({ removed: null });
        }, this.state.busy) : null,
        h('p', { className: 'sf-help' }, 'Quitar una foto de la galería no borra el archivo ni cambia la imagen principal.'));
    }
  });

  const NativeImage = CMS.getWidget('image').control;
  const Cover = createClass({
    shouldComponentUpdate() { return true; },
    render() {
      const photos = U.list(this.props.entry.getIn(['data', 'fotos']));
      return h('div', { className: 'sf-cover' },
        h(NativeImage, Object.assign({}, this.props, { getAsset: (path, field) => asset(this.props, path, field) })),
        photos.length ? h('details', null, h('summary', null, 'Elegir imagen principal desde la galería (' + photos.length + ')'),
          h('div', { className: 'sf-photo-grid' }, photos.map((path, index) => button(
            [image(this.props, path, 'Usar foto ' + (index + 1) + ' como principal', { key: 'image' }), h('span', { key: 'label' }, this.props.value === path ? '✓ Principal' : 'Usar foto ' + (index + 1))],
            () => this.props.onChange(path), false, { key: path + index, className: 'sf-cover-choice', 'aria-pressed': this.props.value === path })))) : null);
    }
  });
  const Preview = createClass({
    render() {
      const p = data(this.props), photos = U.list(p.fotos), hero = p.imagen || photos[0];
      const expectedState = { disponible: 'Disponible', gestionada: 'Arrendada', vendida: 'Vendida' }[p.estado];
      const sections = [['caracteristicas', 'Características'], ['descripcion', 'Descripción'], ['informacionImportante', 'Información importante'], ['areasComunes', 'Áreas comunes'], ['conectividad', 'Conectividad'], ['requisitos', 'Requisitos de arriendo']];
      return h('article', { className: 'sf-preview' },
        h('header', { className: 'sf-preview-header' }, h('strong', null, 'SOTO FRAU'), h('span', null, 'Vista previa en vivo · Formulario')),
        h('div', { className: 'sf-notice' }, 'Guardar / Publicar en el panel lleva el contenido a contenido-borradores. La web requiere el paso a main y el despliegue de Netlify.'),
        !p.imagen ? h('p', { className: 'sf-warning' }, 'Falta elegir la imagen principal. La vista previa usa la primera foto como referencia.') : null,
        expectedState && p.estadoTexto !== expectedState ? h('p', { className: 'sf-warning' }, 'Revisa el estado y su texto visible: no coinciden.') : null,
        p.publicada === false ? h('p', { className: 'sf-warning' }, 'Propiedad oculta: no se mostrará en el catálogo público.') : null,
        hero ? image(this.props, hero, p.titulo || 'Imagen principal', { className: 'sf-hero', loading: 'eager' }) : h('div', { className: 'sf-placeholder' }, 'Las fotografías aparecerán aquí'),
        h('div', { className: 'sf-preview-body' },
          h('div', { className: 'sf-badges' }, [p.operacion, p.estadoTexto || p.estado, p.tipoPropiedad, p.id ? 'ID ' + p.id : 'Sin ID'].filter(Boolean).map((v, i) => h('span', { key: i }, v))),
          h('h1', null, p.titulo || 'Título de la propiedad'), h('p', { className: 'sf-location' }, [p.ubicacion, p.direccion].filter(Boolean).join(' · ')),
          h('p', { className: 'sf-price' }, p.precio || 'Precio por completar'),
          [['gastosComunes','Gastos comunes'],['totalMensual','Total mensual'],['precioAlternativo','Precio alternativo'],['precioBodega','Precio con bodega']].map(([key,label]) => p[key] ? h('p', { key }, h('strong', null, label + ': '), p[key]) : null),
          h('dl', { className: 'sf-facts' }, [['superficie','Superficie'],['dormitorios','Dormitorios'],['banos','Baños'],['estacionamientos','Estacionamientos'],['bodegas','Bodegas'],['piso','Piso'],['orientacion','Orientación'],['mascotas','Mascotas']].filter(([key]) => p[key] !== undefined && p[key] !== null && p[key] !== '').map(([key,label]) => h('div', { key }, h('dt', null, label), h('dd', null, String(p[key]))))),
          h('section', null, h('h2', null, 'Galería · ' + photos.length + ' fotos'), h('div', { className: 'sf-preview-gallery' }, photos.map((path, i) => h('figure', { key: path + i }, image(this.props, path, 'Foto ' + (i + 1)), h('figcaption', null, 'Foto ' + (i + 1)))))),
          sections.map(([key,label]) => U.list(p[key]).length ? h('section', { key }, h('h2', null, label), U.list(p[key]).map((text,i) => h('p', { key: i, className: 'sf-paragraph' }, text))) : null),
          p.whatsapp ? h('section', null, h('h2', null, 'Mensaje de consulta por WhatsApp'), h('p', { className: 'sf-paragraph' }, p.whatsapp)) : null));
    }
  });
  CMS.registerWidget('sotofrau-gallery', Gallery);
  CMS.registerWidget('sotofrau-cover', Cover);
  CMS.registerPreviewTemplate('propiedades', Preview);
  CMS.registerPreviewStyle('/admin/preview.css');
  CMS.registerEventListener({ name: 'preSave', handler: ({ entry }) => {
    if (entry.get('collection') !== 'propiedades') return;
    const p = entry.get('data').toJS();
    if (uploadsInProgress) throw new Error('Espera a que termine la preparación de las fotografías antes de guardar.');
    if (!U.validId(p.id)) throw new Error('El ID debe ser un número entero mayor que cero.');
    const path = entry.get('path') || '';
    const previousId = path.match(/\/(\d+)\.json$/);
    if (previousId && String(p.id) !== previousId[1]) throw new Error('No cambies el ID de una propiedad existente: identifica su ficha y su carpeta de fotos.');
    if (p.fotos != null && (!Array.isArray(p.fotos) || p.fotos.some(v => typeof v !== 'string' || !v.trim()))) throw new Error('La galería debe contener solo rutas de fotografías.');
    for (const path of U.list(p.fotos).concat(p.imagen || [])) {
      const uploadedId = uploadIds.get(path);
      if (uploadedId && String(p.id) !== uploadedId) throw new Error('Restablece el ID ' + uploadedId + ': ya se prepararon fotografías en esa carpeta.');
    }
    return entry.get('data');
  } });

  // Decorate labels only; never rewrite fields, data, or React-owned controls.
  const groups = [['id','1 · Identificación'], ['operacion','2 · Operación y estado'], ['direccion','3 · Ubicación'], ['precio','4 · Valores'], ['superficie','5 · Características'], ['fotos','6 · Fotografías'], ['caracteristicas','7 · Detalles de la publicación'], ['requisitos','8 · Requisitos y contacto']];
  function decorate() {
    groups.forEach(([name,title]) => {
      const label = document.querySelector('#nc-root label[for^="' + name + '-field-"]');
      if (label) {
        const field = label.parentElement.parentElement;
        field.classList.add('sf-section-start'); field.dataset.sectionTitle = title; field.id = 'sf-section-' + name;
      }
    });
    const split = document.querySelector('#nc-root .SplitPane');
    if (split) {
      let parent = split.parentElement;
      while (parent && parent.id !== 'nc-root') {
        if (getComputedStyle(parent).minWidth === '800px') parent.classList.add('sf-editor-container');
        parent = parent.parentElement;
      }
    }
    const loading = document.getElementById('admin-loading');
    if (document.querySelector('#nc-root')?.childElementCount) loading.hidden = true;
    document.getElementById('sf-shortcuts').hidden = !document.getElementById('sf-section-id');
  }
  let frame;
  new MutationObserver(() => { if (!frame) frame = requestAnimationFrame(() => { frame = null; decorate(); }); }).observe(document.body, { childList: true, subtree: true });
  document.getElementById('sf-jump').addEventListener('change', event => {
    document.getElementById('sf-section-' + event.target.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    event.target.value = '';
  });
  window.addEventListener('beforeunload', event => { if (uploadsInProgress) { event.preventDefault(); event.returnValue = ''; } });
  CMS.init();
})();
