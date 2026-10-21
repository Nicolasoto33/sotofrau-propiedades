(function (root) {
  'use strict';
  const MAX_BYTES = 15 * 1024 * 1024;
  function list(value) {
    return value && typeof value.toArray === 'function' ? value.toArray() : Array.isArray(value) ? value.slice() : [];
  }
  function validId(value) { return /^[1-9]\d*$/.test(String(value)) && Number.isSafeInteger(Number(value)); }
  function checkFile(file) {
    if (!/\.(jpe?g|png|webp|avif)$/i.test(file.name)) return 'Usa JPG, PNG, WebP o AVIF. Convierte las fotos HEIC antes de agregarlas.';
    if (!file.size || file.size > MAX_BYTES) return 'Cada foto debe pesar entre 1 byte y 15 MB.';
    return '';
  }
  function filename(name, token) {
    const parts = name.toLowerCase().split('.');
    const ext = parts.pop();
    const base = parts.join('-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'foto';
    return base + '-' + token + '.' + ext;
  }
  function move(items, from, to) {
    const result = list(items);
    if (from < 0 || from >= result.length || to < 0 || to >= result.length) return result;
    result.splice(to, 0, result.splice(from, 1)[0]);
    return result;
  }
  function uploadedPath(result, id) {
    if (!result || result.type !== 'ADD_DRAFT_ENTRY_MEDIA_FILE') throw new Error('Decap no confirmó la foto en el borrador. Intenta nuevamente.');
    const path = result.payload && result.payload.path;
    if (typeof path !== 'string' || path.replace(/^\/+/, '').indexOf('propiedades/' + id + '/') !== 0) throw new Error('La carpeta de la foto no coincide con el ID. Revisa el ID antes de continuar.');
    return '/' + path.replace(/^\/+/, '');
  }
  const api = { list, validId, checkFile, filename, move, uploadedPath };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SotofrauGallery = api;
})(typeof window === 'object' ? window : globalThis);
