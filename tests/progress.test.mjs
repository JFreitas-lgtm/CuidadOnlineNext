import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyProgress, sanitizeProgress } from '../src/progress.js';
import { summarizeProgress } from '../src/progress-view.js';

test('normaliza o progresso retornado pela API e remove campos desconhecidos', () => {
  const clean = sanitizeProgress({
    version: 2,
    password: 'não deve permanecer',
    completed: ['pix', 'pix', 'invalid'],
    favorites: ['boleto', 'invalid'],
    lastLesson: 'conta',
    history: [{ type: 'quiz', at: '2026-11-10T10:00:00.000Z', score: 8, total: 12 }, null],
  });
  assert.deepEqual(clean, {
    version: 2,
    completed: ['pix'],
    favorites: ['boleto'],
    lastLesson: 'conta',
    history: [{ type: 'quiz', at: '2026-11-10T10:00:00.000Z', score: 8, total: 12 }],
  });
});

test('descarta resposta incompatível e limita o histórico a 100 eventos', () => {
  assert.deepEqual(sanitizeProgress({ version: 99 }), emptyProgress());
  const history = Array.from({ length: 105 }, (_, index) => ({ type: 'quiz', score: 1, total: 2, at: new Date(1700000000000 + index * 1000).toISOString() }));
  assert.equal(sanitizeProgress({ version: 2, history }).history.length, 100);
});

test('relatório pessoal calcula melhor quiz e próximos assuntos', () => {
  const data = sanitizeProgress({
    version: 2,
    completed: ['pix'],
    history: [
      { type: 'quiz', score: 4, total: 10, at: '2026-10-19T10:00:00.000Z' },
      { type: 'quiz', score: 7, total: 10, at: '2026-10-19T11:00:00.000Z' },
      { type: 'simulation', simulation: 'conversa', outcome: 'safe', at: '2026-10-19T12:00:00.000Z' },
    ],
  });
  const report = summarizeProgress(data);
  assert.equal(report.readings, 1);
  assert.equal(report.quizzes, 2);
  assert.equal(report.simulations, 1);
  assert.equal(report.bestQuiz.score, 7);
  assert.ok(report.reviewLessons.every(lesson => lesson.id !== 'pix'));
});
