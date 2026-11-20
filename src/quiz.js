import { questions } from './content.js';
export function createQuiz() {
  return { index: 0, answer: null, score: 0, finished: false, answers: [] };
}
export function answerQuiz(quiz, answer) {
  if (quiz.finished || quiz.answer !== null || ![true, false, 'unsure'].includes(answer)) return;
  quiz.answer = answer;
  quiz.answers.push(answer);
  if (answer === questions[quiz.index].scam) quiz.score += 1;
}
export function nextQuestion(quiz) {
  if (quiz.finished || quiz.answer === null) return;
  if (quiz.index + 1 === questions.length) quiz.finished = true;
  else quiz.index += 1;
  quiz.answer = null;
}
