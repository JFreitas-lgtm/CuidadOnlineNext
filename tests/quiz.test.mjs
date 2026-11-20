import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQuiz, answerQuiz, nextQuestion } from '../src/quiz.js';
import { questions } from '../src/content.js';

test('não avança sem resposta e não conta cliques repetidos', () => {
  const quiz = createQuiz();
  nextQuestion(quiz);
  assert.equal(quiz.index, 0);
  answerQuiz(quiz, questions[0].scam);
  answerQuiz(quiz, questions[0].scam);
  assert.equal(quiz.score, 1);
});
test('percorre todas as perguntas e calcula acertos e erros', () => {
  const quiz = createQuiz();
  questions.forEach((question, index) => {
    answerQuiz(quiz, index === 1 ? !question.scam : question.scam);
    nextQuestion(quiz);
  });
  assert.equal(quiz.finished, true);
  assert.equal(quiz.score, questions.length - 1);
  answerQuiz(quiz, true);
  nextQuestion(quiz);
  assert.equal(quiz.score, questions.length - 1);
  assert.equal(quiz.index, questions.length - 1);
});
test('reinício começa sem respostas ou pontuação anterior', () => {
  let quiz = createQuiz();
  answerQuiz(quiz, questions[0].scam);
  quiz = createQuiz();
  assert.deepEqual(quiz, { index: 0, answer: null, score: 0, finished: false, answers: [] });
});
test('dúvidas avançam sem contar pontos e ficam disponíveis para revisão', () => {
  const quiz = createQuiz();
  answerQuiz(quiz, 'unsure');
  answerQuiz(quiz, true);
  assert.deepEqual(quiz.answers, ['unsure']);
  assert.equal(quiz.score, 0);
  nextQuestion(quiz);
  assert.equal(quiz.index, 1);
});
