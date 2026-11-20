import { lessons, questions } from './content.js';
import { validateForm } from './validation.js';
import { applyTheme, toggleTheme, setTheme } from './theme.js';
import { icon, decorate } from './icons.js';
import { createQuiz, answerQuiz, nextQuestion } from './quiz.js';
import { createProgressStore } from './progress.js';
import { renderProgress } from './progress-view.js';
import { parseRoute, routeFor } from './routes.js';
import { renderHelp } from './help.js';
import { simulations, createSimulation, chooseConversation, advanceConversation, examineHotspot, completeInspection, renderSimulations } from './simulations.js';
import { favoriteButton, renderLessonResults, shareText } from './learning.js';
import { renderGlossary, renderTerms } from './glossary.js';
import { api, authApi, getSession, ApiError } from './api.js';
import { renderAdmin, renderAdminUser, changeUserStatus } from './admin.js';
import { renderAccount } from './account.js';
const learning = { query: '', onlyFavorites: false, glossaryQuery: '' };
const adminFilters = { q: '', status: '', page: 1 };
const simulationStates = {};
const progress = createProgressStore();

const app = document.querySelector('#app');
const state = { screen: 'login', user: 'Visitante', account: null, section: 'home', lesson: null, completed: new Set(), quiz: createQuiz() };
const navigation = [
  { id: 'home', icon: 'home', title: 'Início' },
  { id: 'learn', icon: 'book-open', title: 'Aprender' },
  { id: 'practice', icon: 'target', title: 'Praticar' },
  { id: 'simulations', icon: 'message-circle', title: 'Simulações' },
  { id: 'progress', icon: 'check-circle', title: 'Meu progresso' },
  { id: 'glossary', icon: 'book-open', title: 'Glossário' },
  { id: 'help', icon: 'heart', title: 'Ajuda' },
];
const $ = selector => app.querySelector(selector);
// Todo texto interpolado passa por escape; nomes digitados usam textContent.
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
function focusHeading(selector) { $(selector)?.focus({ preventScroll: true }); }
function resetPractice() {
  state.quiz = createQuiz();
  state.reviewQuiz = false;
  for (const id of Object.keys(simulationStates)) delete simulationStates[id];
}
function updateStorageStatus() {
  $('#storage-status').textContent = state.account ? 'Progresso sincronizado com sua conta.' : 'Você está como visitante. Entre para salvar favoritos, resultados e histórico.';
}
function requireAccount() {
  if (state.account) return true;
  changeRoute('#login');
  return false;
}
function handleError(error) {
  if (error instanceof ApiError && ['AUTH_REQUIRED', 'SESSION_EXPIRED'].includes(error.code)) {
    state.account = null;
    progress.setAuthenticated(false);
    changeRoute('#login');
    return;
  }
  const status = $('#storage-status');
  const authError = $('#auth-error');
  if (status) status.textContent = error.message || 'Não foi possível concluir a ação.';
  else if (authError) {
    authError.textContent = error.message || 'Não foi possível concluir a ação.';
    authError.hidden = false;
  }
  else alert(error.message || 'Não foi possível concluir a ação.');
}
function mount(template) {
  app.replaceChildren(document.querySelector(template).content.cloneNode(true));
  decorate(app);
  window.scrollTo(0, 0);
}

function field(name, label, placeholder, type = 'text') {
  const password = type === 'password';
  return `<div class="field"><label class="label" for="${name}">${label}</label><div class="input-wrap"><input id="${name}" name="${name}" type="${type}" placeholder="${placeholder}" autocomplete="${password ? 'off' : name}" ${type === 'email' ? 'autocapitalize="none" spellcheck="false"' : ''} aria-describedby="${name}-error">${password ? `<button type="button" class="show-password" data-action="password" data-field="${name}" aria-label="Mostrar senha" aria-pressed="false">${icon('eye', 19)}</button>` : ''}</div><p class="error" id="${name}-error" aria-live="polite" hidden></p></div>`;
}

function renderAuth(focus = false) {
  const register = state.screen === 'register';
  mount('#auth-template');
  $('.auth-page').classList.toggle('register', register);
  $('#auth-title').textContent = register ? 'Vamos começar?' : 'Bem-vindo de volta!';
  $('#auth-description').textContent = register ? 'Crie sua conta para salvar seu progresso com segurança.' : 'Entre para continuar de onde parou.';
  $('#auth-fields').innerHTML = (register ? field('name', 'Como você se chama?', 'Seu nome') : '')
    + field('email', 'E-mail', 'nome@exemplo.com', 'email')
    + field('password', 'Senha', 'Pelo menos 8 caracteres', 'password')
    + (register ? field('confirm', 'Confirme sua senha', 'Digite a senha novamente', 'password') : '');
  $('#submit-auth').textContent = register ? 'Criar conta' : 'Entrar';
  $('#switch-description').textContent = register ? 'Já tem uma conta?' : 'Ainda não tem uma conta?';
  $('#switch-auth').textContent = register ? 'Entrar' : 'Criar conta';
  applyTheme(true);
  if (focus) focusHeading('#auth-title');
}

async function submitAuth(event) {
  event.preventDefault();
  const form = event.target;
  const authError = $('#auth-error');
  authError.textContent = '';
  authError.hidden = true;
  const values = Object.fromEntries(new FormData(form));
  const register = state.screen === 'register';
  const errors = validateForm({ ...values, register });
  form.querySelectorAll('input').forEach(input => {
    const message = errors[input.name];
    input.setAttribute('aria-invalid', String(Boolean(message)));
    input.parentElement.classList.toggle('invalid', Boolean(message));
    const error = $(`#${input.name}-error`);
    error.textContent = message || '';
    error.hidden = !message;
  });
  if (Object.keys(errors).length) {
    form.querySelector('[aria-invalid="true"]').focus();
    return;
  }
  const submit = $('#submit-auth');
  submit.disabled = true;
  try {
    const result = register ? await authApi.register(values) : await authApi.login(values);
    await enter(result.user);
  } catch (error) {
    for (const [name, message] of Object.entries(error.fields || {})) {
      const input = form.elements[name];
      if (!input) continue;
      input.setAttribute('aria-invalid', 'true');
      input.parentElement.classList.add('invalid');
      const output = $(`#${name}-error`);
      output.textContent = message;
      output.hidden = false;
    }
    if (error.fields && Object.keys(error.fields).length) form.querySelector('[aria-invalid="true"]')?.focus();
    else handleError(error);
  } finally { submit.disabled = false; }
}

async function enter(account, updateRoute = true) {
  resetPractice();
  const user = account?.name || 'Visitante';
  state.account = account || null;
  progress.setAuthenticated(Boolean(account));
  if (account) {
    setTheme(account.theme);
    await progress.load();
  }
  Object.assign(state, { screen: 'dashboard', user, section: 'home', lesson: null, completed: new Set(progress.read().completed), quiz: createQuiz() });
  mount('#dashboard-template');
  $('#user-name').textContent = user.split(' ')[0];
  $('#user-avatar').textContent = user[0].toUpperCase();
  $('[data-action="theme"]').innerHTML = icon('bulb', 23);
  applyTheme(false);
  if (updateRoute) changeRoute('#inicio');
}

function changeRoute(hash) {
  if (location.hash !== hash) history.pushState(null, '', hash);
  applyRoute().catch(handleError);
}
function navigate(section, detail) { changeRoute(routeFor(section, detail)); }
async function applyRoute() {
  const route = parseRoute(location.hash);
  if (route.screen !== 'dashboard') {
    if (state.account) {
      changeRoute('#inicio');
      return;
    }
    state.screen = route.screen;
    state.user = 'Visitante';
    renderAuth(true);
    return;
  }
  if (state.screen !== 'dashboard') await enter(state.account, false);
  if (route.section === 'account' && !state.account) {
    changeRoute('#login');
    return;
  }
  if (route.section === 'admin' && state.account?.role !== 'admin') {
    changeRoute('#inicio');
    return;
  }
  state.section = route.section;
  state.detail = route.detail;
  state.lesson = route.lesson;
  if (route.lesson && state.account) await progress.visitLesson(route.lesson);
  await renderDashboard();
  window.scrollTo(0, 0);
  focusHeading('#page-title');
}

async function renderDashboard() {
  const data = progress.read();
  state.completed = new Set(data.completed);
  const { section, completed } = state;
  const accountItem = state.account ? [{ id: 'account', icon: 'user', title: 'Minha conta' }] : [];
  const adminItem = state.account?.role === 'admin' ? [{ id: 'admin', icon: 'shield', title: 'Administração' }] : [];
  const items = [...navigation, ...accountItem, ...adminItem];
  app.querySelectorAll('[data-nav]').forEach(nav => {
    nav.innerHTML = items.map(item => `<a class="nav-item ${section === item.id ? 'active' : ''}" href="${routeFor(item.id)}" ${section === item.id ? 'aria-current="page"' : ''}>${icon(item.icon)}<span>${item.title}</span>${section === item.id ? '<span class="nav-dot"></span>' : ''}</a>`).join('')
      + (nav.classList.contains('mobile-nav') ? '<button class="link" data-action="exit">Sair</button>' : '');
  });
  $('#page-title').textContent = section === 'home' ? `Olá, ${state.user.split(' ')[0]}!` : section === 'learn' ? 'Aprender a se proteger' : 'Vamos praticar?';
  $('#page-description').textContent = section === 'home' ? 'Que tal aprender algo novo para navegar com mais segurança?' : section === 'learn' ? 'Escolha um assunto. Aqui, tudo é explicado com calma.' : 'Treine seu olhar em situações do dia a dia. Pode errar: é assim que se aprende.';
  if (section === 'progress') {
    $('#page-title').textContent = 'Meu progresso';
    $('#page-description').textContent = 'Veja o que você já aprendeu e escolha seu próximo passo.';
  }
  if (section === 'help') {
    $('#page-title').textContent = 'Acho que caí em um golpe';
    $('#page-description').textContent = 'Vamos por partes. Veja orientações para buscar ajuda com segurança.';
  }
  if (section === 'simulations') {
    $('#page-title').textContent = 'Aprender na prática';
    $('#page-description').textContent = 'Explore exemplos fictícios e descubra o que conferir antes de agir.';
  }
  if (section === 'glossary') {
    $('#page-title').textContent = 'Palavras sem complicação';
    $('#page-description').textContent = 'Entenda os termos que aparecem nas mensagens e nas leituras.';
  }
  if (section === 'admin') {
    $('#page-title').textContent = 'Administração';
    $('#page-description').textContent = 'Acompanhe usuários e atividades do CuidadOnline.';
  }
  if (section === 'account') {
    $('#page-title').textContent = 'Minha conta';
    $('#page-description').textContent = 'Atualize seu nome ou altere sua senha.';
  }
  const resume = lessons.find(lesson => lesson.id === data.lastLesson && !completed.has(lesson.id));
  $('#resume-reading').innerHTML = resume ? '<div class="resume-card"><div><p class="label">Continue de onde parou</p><p class="small">' + escape(resume.title) + '</p></div><a class="button secondary" href="#aprender/' + resume.id + '">Continuar leitura</a></div>' : '';
  $('#learning-area').hidden = !['home', 'learn', 'practice'].includes(section);
  $('#extra-panel').hidden = !['progress', 'help', 'simulations', 'glossary', 'account', 'admin'].includes(section);
  if (section === 'progress') $('#extra-panel').innerHTML = renderProgress(data, progress.persistent);
  if (section === 'glossary') $('#extra-panel').innerHTML = renderGlossary(learning.glossaryQuery);
  if (section === 'help') $('#extra-panel').innerHTML = renderHelp(state.detail);
  if (section === 'simulations') await renderSimulationPanel();
  if (section === 'admin') await renderAdmin($('#extra-panel'), adminFilters);
  if (section === 'account' && state.account) renderAccount($('#extra-panel'), state.account);
  updateStorageStatus();
  $('#home-overview').hidden = section !== 'home';
  $('#completed-count').textContent = completed.size;
  $('#completed-total').textContent = lessons.length;
  $('#completed-percent').textContent = Math.round(completed.size / lessons.length * 100);
  $('#reading-progress').max = lessons.length;
  $('#reading-progress').value = completed.size;
  $('#lessons-panel').hidden = section === 'practice';
  $('#learning-area').classList.toggle('practice', section === 'practice');
  renderLessons();
  renderQuiz();
}

function topicIcon(lesson) {
  return `<span class="topic-icon" style="background:${lesson.bg};color:${lesson.color}">${icon(lesson.icon)}</span>`;
}

function currentSimulation() {
  if (!simulations.some(item => item.id === state.detail)) return null;
  return simulationStates[state.detail] ||= createSimulation(state.detail);
}
async function renderSimulationPanel(focus = false) {
  const current = currentSimulation();
  if (current?.finished && !current.recorded) {
    if (state.account) await progress.recordSimulation(current.id, current.node === 'risk' ? 'risk' : current.node === 'safe' ? 'safe' : 'completed');
    current.recorded = true;
  }
  $('#extra-panel').innerHTML = renderSimulations(state.detail, current);
  updateStorageStatus();
  if (focus) focusHeading($('#simulation-feedback') ? '#simulation-feedback' : '#simulation-title');
}

function renderLessons() {
  const lesson = lessons.find(item => item.id === state.lesson);
  $('#lessons-panel').innerHTML = `<div class="section-heading"><h2 class="section-title" id="lessons-title" tabindex="-1">${lesson ? 'Vamos entender' : 'Conheça os golpes mais comuns'}</h2>${lesson ? '<button class="link" data-action="back-lessons">← Voltar</button>' : ''}</div>`
    + (lesson ? `<article class="lesson-detail">${topicIcon(lesson)}<h3 class="card-title">${escape(lesson.title)}</h3><p class="body">${escape(lesson.intro)}</p><ol class="tips">${lesson.tips.map(tip => `<li class="body">${escape(tip)}</li>`).join('')}</ol><div class="action-row">${favoriteButton(lesson, progress.read().favorites)}<button class="button secondary" data-action="share-lesson">Compartilhar dicas</button></div><button class="button full complete-button" data-action="complete">Concluir leitura ✓</button></article>`
      : `<div class="learning-controls"><label class="label" for="lesson-search">Buscar um assunto</label><input class="search-input" id="lesson-search" type="search" maxlength="120" placeholder="Ex.: Pix, boleto, código" value="${escape(learning.query)}"><div class="action-row"><button class="button secondary" data-action="filter-favorites" aria-pressed="${learning.onlyFavorites}">♥ Só favoritos</button><a class="link" href="#glossario">Consultar o glossário →</a></div></div><div id="lesson-results">${renderLessonResults(learning.query, progress.read(), learning.onlyFavorites)}</div>`);
}

function renderQuiz(focus = false) {
  const quiz = state.quiz;
  const question = questions[quiz.index];
  $('#quiz-panel').innerHTML = `<div class="between"><p class="kicker">APRENDA NA PRÁTICA</p><p class="small">${quiz.finished ? 'Concluído' : `${quiz.index + 1} de ${questions.length}`}</p></div><h2 class="card-title" id="quiz-title" tabindex="-1">${quiz.finished ? 'Cada tentativa ensina.' : 'É golpe ou não?'}</h2>`
    + (quiz.finished ? `<p class="description">Você acertou ${quiz.score} de ${questions.length} situações. Continue praticando para reconhecer os sinais com mais confiança.</p><div class="option-list"><button class="button full" data-action="restart-quiz">Praticar novamente</button><button class="button secondary full" data-action="review-quiz" aria-expanded="${Boolean(state.reviewQuiz)}">${state.reviewQuiz ? 'Fechar revisão' : 'Revisar minhas respostas'}</button></div>${state.reviewQuiz ? renderQuizReview(quiz) : ''}`
      : `<p class="small">Imagine que você recebeu esta mensagem:</p><div class="message"><div class="row"><span class="avatar-small">${icon('user', 18)}</span><div><p class="label">${escape(question.sender)}</p><p class="tiny">Situação fictícia</p></div></div><p class="message-text">${escape(question.message)}</p><p class="tiny message-time">10:42</p></div>`
        + (quiz.answer === null ? '<div class="row quiz-answers"><button class="button" data-action="answer" data-answer="true">É golpe</button><button class="button secondary" data-action="answer" data-answer="false">Parece seguro</button></div><button class="link full" data-action="answer" data-answer="unsure">Não tenho certeza</button>'
          : `<div class="feedback ${quiz.answer === question.scam ? 'success' : 'warning'}" role="status" tabindex="-1"><p class="label">${quiz.answer === 'unsure' ? 'Tudo bem ter dúvida. Vamos conferir.' : quiz.answer === question.scam ? 'Isso mesmo!' : 'Vamos entender juntos.'}</p><p class="body">${escape(question.explanation)}</p></div><button class="button secondary full" data-action="next-question">${quiz.index + 1 === questions.length ? 'Ver resultado' : 'Próxima situação →'}</button>`));
  if (focus) focusHeading(quiz.answer !== null && !quiz.finished ? '.feedback' : '#quiz-title');
}

function renderQuizReview(quiz) {
  return `<section class="quiz-review" aria-label="Revisão das respostas"><h3 class="section-title" id="review-title" tabindex="-1">O que posso revisar?</h3><p class="small">Respostas “Não tenho certeza” ficam para revisão e não somam acertos.</p>${questions.map((question, index) => `<article class="review-item"><p class="label">${index + 1}. ${escape(question.sender)}</p><p class="body">${escape(question.message)}</p><p class="small">Sua resposta: ${quiz.answers[index] === 'unsure' ? 'Não tenho certeza' : quiz.answers[index] ? 'É golpe' : 'Parece seguro'} · ${quiz.answers[index] === question.scam ? 'Acertou' : 'Vamos revisar'}</p><p class="body">${escape(question.explanation)}</p><a class="link" href="#aprender/${question.lesson}">Revisar este assunto →</a></article>`).join('')}</section>`;
}

const actions = {
  favorite: async button => {
    if (!requireAccount()) return;
    const id = button.dataset.id;
    await progress.toggleFavorite(id);
    renderLessons();
    updateStorageStatus();
    ($('[data-action="favorite"][data-id="' + id + '"]') || $('[data-action="filter-favorites"]'))?.focus();
  },
  'filter-favorites': () => { learning.onlyFavorites = !learning.onlyFavorites; renderLessons(); $('[data-action="filter-favorites"]').focus(); },
  'share-lesson': () => {
    const lesson = lessons.find(item => item.id === state.lesson);
    if (!lesson) return;
    document.querySelector('#share-text').value = shareText(lesson);
    document.querySelector('#share-status').textContent = '';
    document.querySelector('#share-dialog').showModal();
  },
  guest: () => enter(null),
  'switch-auth': () => { changeRoute(state.screen === 'register' ? '#login' : '#cadastro'); },
  password: button => {
    const input = $(`#${button.dataset.field}`);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    button.innerHTML = icon(show ? 'eye-off' : 'eye', 19);
    button.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    button.setAttribute('aria-pressed', String(show));
  },
  theme: async () => {
    const theme = toggleTheme();
    if (state.account) {
      await authApi.theme(theme);
      state.account.theme = theme;
    }
  },
  exit: async () => {
    resetPractice();
    if (state.account) await authApi.logout();
    state.account = null;
    progress.setAuthenticated(false);
    changeRoute('#login');
  },
  navigate: button => navigate(button.dataset.section),
  'start-learning': () => navigate('learn', lessons[0].id),
  lesson: button => navigate('learn', button.dataset.id),
  'back-lessons': () => navigate('learn'),
  complete: async () => {
    if (!requireAccount()) return;
    if (!lessons.some(item => item.id === state.lesson)) return;
    await progress.completeLesson(state.lesson);
    navigate('learn');
  },
  answer: button => { answerQuiz(state.quiz, button.dataset.answer === 'unsure' ? 'unsure' : button.dataset.answer === 'true'); renderQuiz(true); },
  'next-question': async () => { const finished = state.quiz.finished; nextQuestion(state.quiz); if (!finished && state.quiz.finished && state.account) await progress.recordQuiz(state.quiz.score, questions.length, state.quiz.answers); updateStorageStatus(); renderQuiz(true); },
  'clear-progress': () => { if (!requireAccount()) return; const dialog = document.querySelector('#clear-dialog'); dialog.returnValue = 'cancel'; dialog.showModal(); },
  'conversation-choice': async button => { if (chooseConversation(currentSimulation(), Number(button.dataset.index))) await renderSimulationPanel(true); },
  'advance-conversation': async () => { if (advanceConversation(currentSimulation())) await renderSimulationPanel(true); },
  inspect: async button => { if (examineHotspot(currentSimulation(), button.dataset.id)) await renderSimulationPanel(true); },
  'complete-inspection': async () => { if (completeInspection(currentSimulation())) await renderSimulationPanel(true); },
  'restart-simulation': async () => { simulationStates[state.detail] = createSimulation(state.detail); await renderSimulationPanel(); focusHeading('#page-title'); },
  'restart-quiz': () => { state.quiz = createQuiz(); state.reviewQuiz = false; renderQuiz(true); },
  'review-quiz': () => { state.reviewQuiz = !state.reviewQuiz; renderQuiz(); focusHeading(state.reviewQuiz ? '#review-title' : '#quiz-title'); },
  'admin-status': async button => {
    if (!confirm(`${button.dataset.status === 'disabled' ? 'Desativar' : 'Reativar'} esta conta?`)) return;
    await changeUserStatus(button.dataset.id, button.dataset.status);
    await renderAdmin($('#extra-panel'), adminFilters);
  },
  'admin-user': button => renderAdminUser($('#extra-panel'), button.dataset.id),
  'admin-back': () => renderAdmin($('#extra-panel'), adminFilters),
  'admin-page': async button => { adminFilters.page = Number(button.dataset.page); await renderAdmin($('#extra-panel'), adminFilters); },
};

// Um único registro de eventos continua funcionando após atualizar as telas.
app.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (button && app.contains(button)) Promise.resolve(actions[button.dataset.action]?.(button)).catch(handleError);
});
app.addEventListener('input', event => {
  if (event.target.id === 'lesson-search') {
    learning.query = event.target.value;
    $('#lesson-results').innerHTML = renderLessonResults(learning.query, progress.read(), learning.onlyFavorites);
  }
  if (event.target.id === 'glossary-search') {
    learning.glossaryQuery = event.target.value;
    $('#glossary-results').innerHTML = renderTerms(learning.glossaryQuery);
  }
});
app.addEventListener('submit', event => {
  if (event.target.id === 'auth-form') submitAuth(event).catch(handleError);
  if (event.target.id === 'admin-filter-form') {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.target));
    Object.assign(adminFilters, { q: values.q.trim(), status: values.status, page: 1 });
    renderAdmin($('#extra-panel'), adminFilters).catch(handleError);
  }
  if (event.target.id === 'profile-form') {
    event.preventDefault();
    const output = event.target.querySelector('#profile-status');
    api('/account/profile', { method: 'PATCH', body: Object.fromEntries(new FormData(event.target)) }).then(result => {
      state.account = result.user;
      state.user = result.user.name;
      output.textContent = 'Nome atualizado.';
    }).catch(error => { output.textContent = error.message; });
  }
  if (event.target.id === 'password-form') {
    event.preventDefault();
    const output = event.target.querySelector('#password-status');
    api('/account/password', { method: 'PATCH', body: Object.fromEntries(new FormData(event.target)) }).then(() => {
      event.target.reset();
      output.textContent = 'Senha alterada com sucesso.';
    }).catch(error => { output.textContent = error.message; });
  }
});
document.querySelector('#clear-dialog').addEventListener('close', async event => {
  if (event.target.returnValue === 'clear') {
    await progress.clear();
    resetPractice();
    await renderDashboard();
    $('#storage-status').textContent = 'Seu progresso foi apagado. Sua conta continua ativa.';
  }
  $('[data-action="clear-progress"]')?.focus();
});
window.addEventListener('hashchange', () => applyRoute().catch(handleError));
window.addEventListener('popstate', () => applyRoute().catch(handleError));
document.querySelector('.skip-link').addEventListener('click', event => {
  event.preventDefault();
  $('#main-content')?.focus();
});

document.querySelector('#copy-tips').addEventListener('click', async () => {
  const text = document.querySelector('#share-text');
  const status = document.querySelector('#share-status');
  try {
    await navigator.clipboard.writeText(text.value);
    status.textContent = 'Dicas copiadas. Cole na conversa que você escolher.';
  } catch {
    text.focus(); text.select();
    status.textContent = 'A cópia automática não está disponível. O texto está selecionado: use Copiar no seu aparelho.';
  }
});

async function initialize() {
  try {
    state.account = await getSession();
    progress.setAuthenticated(Boolean(state.account));
    if (state.account) {
      setTheme(state.account.theme);
      await progress.load();
      if (!location.hash || ['#login', '#cadastro'].includes(location.hash)) history.replaceState(null, '', '#inicio');
    }
    await applyRoute();
  } catch (error) {
    state.account = null;
    progress.setAuthenticated(false);
    state.screen = 'login';
    renderAuth();
    handleError(error);
  }
}
initialize();
