import { api } from './api.js';
import { escape, dateLabel } from './ui.js';

const query = values => new URLSearchParams(Object.entries(values).filter(([, value]) => value !== '' && value !== null)).toString();

export async function renderAdmin(container, filters = {}) {
  const current = { q: filters.q || '', status: filters.status || '', page: filters.page || 1 };
  container.innerHTML = '<div class="panel" role="status">Carregando dados administrativos…</div>';
  const [summary, users, audit] = await Promise.all([
    api('/admin/summary'),
    api(`/admin/users?${query(current)}`),
    api('/admin/audit'),
  ]);
  container.innerHTML = `<div class="summary-grid">
    <article class="panel"><p class="kicker">USUÁRIOS</p><h2 class="card-title">${summary.total_users}</h2><p class="small">${summary.active_users} ativos · ${summary.disabled_users} desativados</p></article>
    <article class="panel"><p class="kicker">NOVOS EM 30 DIAS</p><h2 class="card-title">${summary.new_30_days}</h2><p class="small">${summary.new_7_days} nos últimos 7 dias</p></article>
    <article class="panel"><p class="kicker">LEITURAS</p><h2 class="card-title">${summary.lessons_completed}</h2><p class="small">conclusões registradas</p></article>
    <article class="panel"><p class="kicker">QUIZZES</p><h2 class="card-title">${summary.quizzes_completed}</h2><p class="small">média de ${summary.average_quiz_percent}%</p></article>
  </div>
  <section class="panel"><h2 class="section-title">Usuários</h2>
    <form id="admin-filter-form" class="admin-filters"><label class="label" for="admin-search">Buscar</label><input class="search-input" id="admin-search" name="q" value="${escape(current.q)}" placeholder="Nome ou e-mail"><label class="label" for="admin-status">Status</label><select class="search-input" id="admin-status" name="status"><option value="">Todos</option><option value="active" ${current.status === 'active' ? 'selected' : ''}>Ativos</option><option value="disabled" ${current.status === 'disabled' ? 'selected' : ''}>Desativados</option></select><button class="button" type="submit">Filtrar</button></form>
    <p class="small">${users.total} conta(s) encontrada(s)</p>
    <div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Status</th><th>Cadastro</th><th>Ações</th></tr></thead><tbody>${users.users.map(user => `<tr><td><button class="link" data-action="admin-user" data-id="${user.id}">${escape(user.name)}</button></td><td>${escape(user.email)}</td><td>${user.status === 'active' ? 'Ativo' : 'Desativado'}</td><td>${dateLabel(user.created_at)}</td><td><button class="link" data-action="admin-status" data-id="${user.id}" data-status="${user.status === 'active' ? 'disabled' : 'active'}">${user.status === 'active' ? 'Desativar' : 'Reativar'}</button></td></tr>`).join('') || '<tr><td colspan="5">Nenhum usuário encontrado.</td></tr>'}</tbody></table></div>
    <div class="action-row">${users.page > 1 ? `<button class="button secondary" data-action="admin-page" data-page="${users.page - 1}">Anterior</button>` : ''}<span class="small">Página ${users.page} de ${Math.max(users.pages, 1)}</span>${users.page < users.pages ? `<button class="button secondary" data-action="admin-page" data-page="${users.page + 1}">Próxima</button>` : ''}</div>
  </section>
  <section class="panel"><h2 class="section-title">Atividade geral</h2><p class="description">${summary.users_with_activity} usuário(s) com atividades · ${summary.simulations_completed} simulação(ões) concluída(s).</p><p class="small">Assuntos acessados: ${summary.popularLessons.map(item => `${escape(item.lesson_id)} (${item.visits})`).join(', ') || 'ainda sem dados'}.</p></section>
  <section class="panel"><h2 class="section-title">Auditoria administrativa</h2>${audit.entries.length ? `<ol class="activity-list">${audit.entries.slice(0, 10).map(entry => `<li><span>${escape(entry.admin_email)} · ${escape(entry.action)} · ${escape(entry.target_email || 'sem usuário')}</span><time class="small" datetime="${entry.created_at}">${dateLabel(entry.created_at)}</time></li>`).join('')}</ol>` : '<p class="description">Ainda não há ações administrativas registradas.</p>'}</section>`;
  container.dataset.adminFilters = JSON.stringify(current);
}

export async function renderAdminUser(container, id) {
  container.innerHTML = '<div class="panel" role="status">Carregando usuário…</div>';
  const { user, progress } = await api(`/admin/users/${id}`);
  const quizCount = progress.history.filter(item => item.type === 'quiz').length;
  const simulationCount = progress.history.filter(item => item.type === 'simulation').length;
  container.innerHTML = `<button class="link" data-action="admin-back">← Voltar para usuários</button><section class="panel"><p class="kicker">DETALHE DO USUÁRIO</p><h2 class="card-title">${escape(user.name)}</h2><p class="description">${escape(user.email)}</p><div class="summary-grid"><div><p class="label">Status</p><p class="small">${user.status === 'active' ? 'Ativo' : 'Desativado'}</p></div><div><p class="label">Cadastro</p><p class="small">${dateLabel(user.created_at)}</p></div><div><p class="label">Último acesso</p><p class="small">${user.last_login_at ? dateLabel(user.last_login_at) : 'Ainda não registrado'}</p></div></div></section><div class="summary-grid"><article class="panel"><p class="kicker">LEITURAS</p><h2 class="card-title">${progress.completed.length}</h2></article><article class="panel"><p class="kicker">FAVORITOS</p><h2 class="card-title">${progress.favorites.length}</h2></article><article class="panel"><p class="kicker">QUIZZES</p><h2 class="card-title">${quizCount}</h2></article><article class="panel"><p class="kicker">SIMULAÇÕES</p><h2 class="card-title">${simulationCount}</h2></article></div><section class="panel"><h2 class="section-title">Histórico recente</h2>${progress.history.length ? `<ol class="activity-list">${[...progress.history].reverse().map(item => `<li><span>${escape(item.type === 'lesson' ? `Leitura: ${item.lesson}` : item.type === 'quiz' ? `Quiz: ${item.score}/${item.total}` : `Simulação: ${item.simulation}`)}</span><time class="small" datetime="${item.at}">${dateLabel(item.at)}</time></li>`).join('')}</ol>` : '<p class="description">Nenhuma atividade registrada.</p>'}</section>`;
}

export const changeUserStatus = (id, status) => api(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } });
