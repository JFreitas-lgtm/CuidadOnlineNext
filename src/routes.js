import { lessons } from './content.js';

const sections = { inicio: 'home', aprender: 'learn', praticar: 'practice', progresso: 'progress', ajuda: 'help', simulacoes: 'simulations', glossario: 'glossary', conta: 'account', admin: 'admin' };
export function parseRoute(hash) {
  const [page, detail, extra] = hash.replace(/^#\/?/, '').split('/');
  if (page === 'cadastro' && !detail) return { screen: 'register' };
  if (!page || page === 'login' || !sections[page] || extra) return { screen: 'login' };
  const section = sections[page];
  return { screen: 'dashboard', section, lesson: section === 'learn' && lessons.some(lesson => lesson.id === detail) ? detail : null, detail: detail || null };
}
export function routeFor(section, detail) {
  const page = Object.keys(sections).find(key => sections[key] === section) || 'inicio';
  return `#${page}${detail ? `/${detail}` : ''}`;
}
