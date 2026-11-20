import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSimulation, chooseConversation, advanceConversation, examineHotspot, completeInspection } from '../src/simulations.js';

test('conversa permite interromper e confirmar por um contato conhecido', () => {
  const state = createSimulation('conversa');
  assert.equal(advanceConversation(state), false);
  chooseConversation(state, 0);
  assert.equal(chooseConversation(state, 1), false);
  advanceConversation(state);
  assert.equal(state.finished, true);
  assert.equal(state.node, 'safe');
});
test('escolhas arriscadas levam a uma consequência educativa', () => {
  const state = createSimulation('conversa');
  for (let i = 0; i < 3; i++) { chooseConversation(state, 1); advanceConversation(state); }
  assert.equal(state.node, 'risk');
  assert.equal(state.finished, true);
});
test('loja só pode concluir após explorar todos os pontos sem duplicação', () => {
  const state = createSimulation('loja');
  examineHotspot(state, 'price');
  examineHotspot(state, 'price');
  assert.equal(state.examined.length, 1);
  assert.equal(completeInspection(state), false);
  for (const id of ['address', 'payment', 'lock']) examineHotspot(state, id);
  assert.equal(completeInspection(state), true);
  assert.equal(completeInspection(state), false);
});
