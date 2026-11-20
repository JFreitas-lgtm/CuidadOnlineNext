import { lessons } from './content.js';
import { escape } from './ui.js';
import { icon } from './icons.js';

export const normalizeSearch = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function matchesSearch(text, query) {
  const haystack = normalizeSearch(text);
  return normalizeSearch(query).split(/\s+/).every(word => haystack.includes(word));
}
export function findLessons(query, favorites, onlyFavorites) {
  return lessons.filter(item => (!onlyFavorites || favorites.includes(item.id)) && matchesSearch([item.title, item.summary, item.intro, ...item.tips].join(' '), query));
}
export function favoriteButton(item, favorites) {
  const saved = favorites.includes(item.id);
  return `<button class="button secondary favorite-button" data-action="favorite" data-id="${item.id}" aria-pressed="${saved}" aria-label="${saved ? 'Remover dos favoritos' : 'Favoritar'}: ${escape(item.title)}">${saved ? '♥ Favoritado' : '♡ Favoritar'}</button>`;
}
export function renderLessonResults(query, data, onlyFavorites) {
  const found = findLessons(query, data.favorites, onlyFavorites);
  return `<p class="small" role="status">${found.length} assunto(s) encontrado(s).</p><div class="lesson-grid">${found.map(item => `<article class="lesson-card"><a class="lesson-open" href="#aprender/${item.id}"><span class="between"><span class="topic-icon" style="background:${item.bg};color:${item.color}">${icon(item.icon)}</span><span class="tiny">${data.completed.includes(item.id) ? '✓ Concluído' : '3 min'}</span></span><h3 class="lesson-title">${escape(item.title)}</h3><span class="small">${escape(item.summary)}</span><span class="lesson-link">Aprender a identificar →</span></a>${favoriteButton(item, data.favorites)}</article>`).join('')}</div>${found.length ? '' : '<p class="description">Nenhum assunto por aqui. Tente outra palavra ou desative o filtro de favoritos.</p>'}`;
}
export function shareText(lesson) {
  return `CuidadOnline — ${lesson.title}\n\n${lesson.tips.map((tip, index) => `${index + 1}. ${tip}`).join('\n\n')}\n\nCompartilhe cuidado: confirme informações pelos canais oficiais.`;
}
