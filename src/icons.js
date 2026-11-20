// Ícones SVG locais, sem fontes ou bibliotecas externas.
const paths = {
  shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  'check-circle': '<path d="M22 11v1a10 10 0 1 1-5.93-9.14M22 4 12 14.01l-3-3"/>',
  home: '<path d="m3 9 9-7 9 7v11a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
  'book-open': '<path d="M12 5v16M2 3h6a4 4 0 0 1 4 4 4 4 0 0 1 4-4h6v17h-6a4 4 0 0 0-4 1 4 4 0 0 0-4-1H2z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0l-1 1-1-1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
  user: '<circle cx="12" cy="7" r="4"/><path d="M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2"/>',
  repeat: '<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-1v2a3 3 0 0 1-3 3H3"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0v6h6M8 13h8M8 17h8"/>',
  'message-circle': '<path d="M21 11.5a9 9 0 0 1-9.5 9.5 9 9 0 0 1-4-1L2 22l2-5.5a9 9 0 0 1-1-4A9 9 0 0 1 12.5 3H13a9 9 0 0 1 8 8z"/>',
  'shopping-bag': '<path d="m6 2-3 4v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  'eye-off': '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A11 11 0 0 1 12 5c7 0 11 7 11 7a19 19 0 0 1-3 3.7M6.5 6.5A20 20 0 0 0 1 12s4 7 11 7a13 13 0 0 0 5.5-1.5"/>',
  bulb: '<path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1 2-1 2H9s0-1-1-2z"/>',
};
export function icon(name, size = 20) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.shield}</svg>`;
}
export function decorate(root) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
  root.querySelectorAll('[data-brand]').forEach(el => {
    el.innerHTML = `<div class="brand-row ${el.dataset.brand === 'light' ? 'brand-light' : ''}"><span class="logo">${icon('shield', 24)}</span><span class="brand">Cuidad<span class="brand-o">O</span><span class="brand-end">nline</span></span></div>`;
  });
  root.querySelectorAll('[data-shield]').forEach(el => {
    el.innerHTML = `<div class="orbit"><div class="orbit-inner"><div class="shield">${icon('shield', 72)}<span class="shield-check">${icon('check', 30)}</span></div></div></div><div class="art-tag">${icon('check-circle', 17)}<span>Conhecimento que protege</span></div>`;
  });
}
