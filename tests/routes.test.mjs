import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseRoute, routeFor } from '../src/routes.js';
test('links diretos identificam a leitura e a seção corretas', () => {
  assert.deepEqual(parseRoute(routeFor('learn', 'pix')), { screen: 'dashboard', section: 'learn', lesson: 'pix', detail: 'pix' });
  assert.equal(parseRoute('#ajuda/dinheiro').section, 'help');
  assert.equal(parseRoute('#simulacoes/boleto').detail, 'boleto');
  assert.equal(parseRoute('#admin').section, 'admin');
  assert.equal(parseRoute('#conta').section, 'account');
});
test('rotas desconhecidas não são usadas para carregar conteúdo arbitrário', () => {
  assert.deepEqual(parseRoute('#desconhecido'), { screen: 'login' });
  assert.equal(parseRoute('#aprender/desconhecido').lesson, null);
  assert.deepEqual(parseRoute('#cadastro'), { screen: 'register' });
});
