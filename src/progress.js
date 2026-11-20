import { api } from './api.js';
import { lessons } from './content.js';

const lessonIds = new Set(lessons.map(lesson => lesson.id));
const simulationIds = new Set(['conversa', 'loja', 'boleto']);
export const emptyProgress = () => ({ version: 2, completed: [], favorites: [], lastLesson: null, history: [] });

export function sanitizeProgress(value) {
  const clean = emptyProgress();
  if (!value || ![1, 2].includes(value.version)) return clean;
  clean.completed = [...new Set(Array.isArray(value.completed) ? value.completed.filter(id => lessonIds.has(id)) : [])];
  clean.favorites = [...new Set(Array.isArray(value.favorites) ? value.favorites.filter(id => lessonIds.has(id)) : [])];
  clean.lastLesson = lessonIds.has(value.lastLesson) ? value.lastLesson : null;
  clean.history = (Array.isArray(value.history) ? value.history : []).flatMap(event => {
    if (!event || typeof event.at !== 'string' || !Number.isFinite(Date.parse(event.at))) return [];
    const base = { type: event.type, at: new Date(event.at).toISOString() };
    if (event.type === 'lesson' && lessonIds.has(event.lesson)) return [{ ...base, lesson: event.lesson }];
    if (event.type === 'simulation' && simulationIds.has(event.simulation)) return [{ ...base, simulation: event.simulation, outcome: event.outcome }];
    if (event.type === 'quiz' && Number.isInteger(event.total) && event.total > 0 && Number.isInteger(event.score) && event.score >= 0 && event.score <= event.total) return [{ ...base, total: event.total, score: event.score }];
    return [];
  }).slice(-100);
  return clean;
}

export function createProgressStore() {
  let memory = emptyProgress();
  let authenticated = false;
  const update = change => { const next = structuredClone(memory); change(next); memory = sanitizeProgress(next); };
  return {
    read: () => structuredClone(memory),
    get persistent() { return authenticated; },
    setAuthenticated(value) { authenticated = Boolean(value); if (!authenticated) memory = emptyProgress(); },
    async load() { memory = authenticated ? sanitizeProgress(await api('/progress')) : emptyProgress(); return this.read(); },
    async toggleFavorite(id) {
      if (!authenticated || !lessonIds.has(id)) return false;
      const saved = memory.favorites.includes(id);
      await api(`/progress/lessons/${id}/favorite`, { method: saved ? 'DELETE' : 'PUT' });
      update(data => { data.favorites = saved ? data.favorites.filter(item => item !== id) : [...data.favorites, id]; });
      return true;
    },
    async visitLesson(id) {
      if (!authenticated || !lessonIds.has(id)) return false;
      await api(`/progress/lessons/${id}/visit`, { method: 'PUT' });
      update(data => { if (!data.completed.includes(id)) data.lastLesson = id; });
      return true;
    },
    async completeLesson(id) {
      if (!authenticated || !lessonIds.has(id)) return false;
      await api(`/progress/lessons/${id}/complete`, { method: 'PUT' });
      await this.load();
      return true;
    },
    async recordQuiz(score, total, answers) {
      if (!authenticated) return false;
      await api('/progress/quizzes', { method: 'POST', body: { score, total, answers } });
      await this.load();
      return true;
    },
    async recordSimulation(id, outcome = 'completed') {
      if (!authenticated || !simulationIds.has(id)) return false;
      await api('/progress/simulations', { method: 'POST', body: { simulation: id, outcome } });
      await this.load();
      return true;
    },
    async clear() {
      if (!authenticated) return false;
      await api('/progress', { method: 'DELETE' });
      memory = emptyProgress();
      return true;
    },
  };
}
