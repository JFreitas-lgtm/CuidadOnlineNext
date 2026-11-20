import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findLessons, shareText } from '../src/learning.js';
import { lessons } from '../src/content.js';
import { sanitizeProgress } from '../src/progress.js';
import { renderTerms } from '../src/glossary.js';
import { terms } from '../src/glossary.js';
import { parseRoute } from '../src/routes.js';

test('busca ignora acentos e caixa, combina palavras e filtra favoritos', () => {
  assert.deepEqual(findLessons('  CODIGO sms  ', [], false).map(x => x.id), ['whatsapp']);
  assert.deepEqual(findLessons('', ['pix'], true).map(x => x.id), ['pix']);
  assert.equal(findLessons('boleto', ['pix'], true).length, 0);
  assert.equal(findLessons('<script>', [], false).length, 0);
});
test('favoritos vindos da API rejeitam IDs inválidos e duplicados', () => {
  assert.deepEqual(sanitizeProgress({version: 1, favorites: ['pix','pix','bad',null]}).favorites, ['pix']);
});
test('texto compartilhado contém todas as dicas sem endereço local', () => {
  for (const lesson of lessons) {
    const text = shareText(lesson);
    assert.ok(text.includes(lesson.title));
    lesson.tips.forEach(tip => assert.ok(text.includes(tip)));
    assert.ok(!text.includes('localhost'));
  }
});
test('glossário tem rota, busca sem acento e estado vazio', () => {
  assert.equal(parseRoute('#glossario').section, 'glossary');
  assert.ok(renderTerms('verificacao').includes('Código de verificação'));
  assert.ok(renderTerms('zzzz').includes('Não encontramos'));
});
test('novos temas aparecem na busca e possuem termos relacionados', () => {
  assert.deepEqual(findLessons('acesso remoto', [], false).map(item => item.id), ['suporte']);
  assert.deepEqual(findLessons('sessões desconhecidas', [], false).map(item => item.id), ['conta']);
  assert.ok(terms.length >= 10);
  assert.ok(terms.some(term => term.lesson === 'suporte'));
  assert.ok(terms.some(term => term.lesson === 'conta'));
});
