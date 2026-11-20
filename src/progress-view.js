import { lessons } from './content.js';
import { escape, dateLabel } from './ui.js';

export function summarizeProgress(data) {
  const quizzes = data.history.filter(event => event.type === 'quiz');
  const simulations = data.history.filter(event => event.type === 'simulation');
  const bestQuiz = quizzes.reduce((best, current) => {
    if (!best) return current;
    return current.score / current.total > best.score / best.total ? current : best;
  }, null);
  const reviewLessons = lessons.filter(lesson => !data.completed.includes(lesson.id));
  return {
    readings: data.completed.length,
    quizzes: quizzes.length,
    simulations: simulations.length,
    bestQuiz,
    reviewLessons,
  };
}

export function renderProgress(data, persistent) {
  const quizResults = data.history.filter(event => event.type === 'quiz');
  const lastQuiz = quizResults.at(-1);
  const report = summarizeProgress(data);
  const resume = lessons.find(lesson => lesson.id === data.lastLesson && !data.completed.includes(lesson.id));
  const next = resume || lessons.find(lesson => !data.completed.includes(lesson.id));
  const names = { conversa: 'Conversa suspeita', loja: 'Loja fictícia', boleto: 'Boleto de exemplo' };
  return `<div class="notice"><p>${persistent ? 'Seu progresso está sincronizado com sua conta e disponível quando você entrar em outro aparelho.' : 'Você está usando o site como visitante. Entre para salvar seu progresso.'}</p><p class="small">O histórico mostra as últimas 100 atividades registradas.</p></div>
    <section aria-labelledby="personal-report-title"><h2 class="section-title" id="personal-report-title">Meu relatório pessoal</h2><p class="description">Um resumo das atividades registradas na sua conta.</p><div class="summary-grid"><article class="panel"><p class="kicker">LEITURAS</p><h3 class="card-title">${report.readings} de ${lessons.length}</h3><p class="small">temas concluídos</p></article><article class="panel"><p class="kicker">QUIZZES</p><h3 class="card-title">${report.quizzes}</h3><p class="small">tentativas concluídas</p></article><article class="panel"><p class="kicker">MELHOR QUIZ</p><h3 class="card-title">${report.bestQuiz ? `${report.bestQuiz.score} de ${report.bestQuiz.total}` : 'Vamos começar?'}</h3><p class="small">${report.bestQuiz ? 'melhor resultado registrado' : 'Pratique sem pressa.'}</p></article><article class="panel"><p class="kicker">SIMULAÇÕES</p><h3 class="card-title">${report.simulations}</h3><p class="small">atividades concluídas</p></article></div></section>
    <section class="panel"><h2 class="section-title">Assuntos para continuar aprendendo</h2>${report.reviewLessons.length ? `<p class="description">Você ainda pode concluir ${report.reviewLessons.length} tema(s). Escolha um para continuar:</p><div class="action-row">${report.reviewLessons.slice(0, 3).map(lesson => `<a class="button secondary" href="#aprender/${lesson.id}">${escape(lesson.title)}</a>`).join('')}</div>` : '<p class="description">Você concluiu todas as leituras. Continue praticando para reforçar o que aprendeu.</p>'}</section>
    <section class="panel"><h2 class="section-title">${next ? 'Seu próximo passo' : 'Você concluiu todas as leituras!'}</h2><p class="description">${next ? escape(next.title) : 'Continue praticando com novas situações.'}</p><a class="button" href="${next ? `#aprender/${next.id}` : '#praticar'}">${resume ? 'Continuar de onde parei' : next ? 'Continuar aprendendo' : 'Praticar agora'}</a></section>
    <section class="panel"><h2 class="section-title">Histórico de atividades</h2>${data.history.length ? `<ol class="activity-list">${[...data.history].reverse().map(event => {
      const title = event.type === 'lesson' ? `Leitura concluída: ${lessons.find(lesson => lesson.id === event.lesson).title}` : event.type === 'quiz' ? `Quiz concluído: ${event.score} de ${event.total} acertos` : `Simulação concluída: ${names[event.simulation]}`;
      const url = event.type === 'lesson' ? `#aprender/${event.lesson}` : event.type === 'quiz' ? '#praticar' : `#simulacoes/${event.simulation}`;
      return `<li><a href="${url}">${escape(title)}</a><time class="small" datetime="${event.at}">${dateLabel(event.at)}</time></li>`;
    }).join('')}</ol>` : '<p class="description">Ainda não há atividades. Conclua uma leitura, um quiz ou uma simulação para começar.</p>'}</section>
    ${persistent ? '<section class="panel"><h2 class="section-title">Controle do seu histórico</h2><p class="description">Apague as leituras concluídas, os favoritos, os resultados e o ponto de retomada quando quiser. Sua conta será mantida.</p><button class="button secondary" data-action="clear-progress">Apagar meu progresso</button></section>' : '<section class="panel"><h2 class="section-title">Quer guardar seu progresso?</h2><p class="description">Entre ou crie uma conta para sincronizar suas atividades.</p><a class="button" href="#login">Entrar</a></section>'}`;
}
