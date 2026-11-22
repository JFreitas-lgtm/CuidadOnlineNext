"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, Edit3, Plus, Search, ShieldCheck, Trash2, UserCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import type { Lesson } from "@/types";

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } });
  if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message ?? "Falha na operação."); }
  return response.status === 204 ? null as T : response.json();
}

type Summary = { users: number; activeUsers: number; disabledUsers: number; lessons: number; quizzes: number; simulations: number; new7Days: number; new30Days: number; lessonsCompleted: number; averageQuizPercent: number; usersWithActivity: number; popularLessons: { slug: string; visits: number }[] };
type AdminUser = { id: string; name: string; email: string; role: string; status: "active" | "disabled"; createdAt: string; lastLoginAt?: string };
type UsersResponse = { users: AdminUser[]; total: number; page: number; pages: number };
type AuditEntry = { id: string; action: string; createdAt: string; admin: { name: string; email: string } | null; target: { name: string; email: string } | null };
type UserDetail = { user: AdminUser; progress: { completed: string[]; favorites: string[]; lastLesson: string | null; quizzes: { id: string; score: number; total: number; createdAt: string }[]; simulations: { id: string; slug: string; outcome: string; createdAt: string }[] } };
const blank = { slug: "", title: "", summary: "", intro: "", tips: "", color: "#1554ED", background: "#EFF5FF", order: 0 };
const dateLabel = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Ainda não registrado";
const actionLabel: Record<string, string> = { "lesson.created": "criou uma aula", "lesson.updated": "atualizou uma aula", "lesson.deleted": "excluiu uma aula", "user.active": "reativou uma conta", "user.disabled": "desativou uma conta" };

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: number | string; detail: string; icon: typeof Users }) {
  return <Card className="admin-metric"><div className="admin-metric-icon"><Icon size={21}/></div><div><p className="eyebrow">{label}</p><p className="admin-metric-value">{value}</p><p className="muted text-sm">{detail}</p></div></Card>;
}

export function AdminDashboard({ initialLessons }: { initialLessons: Lesson[] }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"overview" | "content" | "users">("overview");
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchDraft, setSearchDraft] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", page: 1 });
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const summary = useQuery<Summary>({ queryKey: ["admin-summary"], queryFn: () => json("/api/admin/summary") });
  const lessons = useQuery<{ lessons: Lesson[] }>({ queryKey: ["lessons"], queryFn: () => json("/api/lessons"), initialData: { lessons: initialLessons } });
  const users = useQuery<UsersResponse>({ queryKey: ["admin-users", filters], queryFn: () => json(`/api/admin/users?${new URLSearchParams({ q: filters.q, status: filters.status, page: String(filters.page) })}`) });
  const audit = useQuery<{ entries: AuditEntry[] }>({ queryKey: ["admin-audit"], queryFn: () => json("/api/admin/audit") });
  const selectedUser = useQuery<UserDetail>({ queryKey: ["admin-user", selectedUserId], queryFn: () => json(`/api/admin/users/${selectedUserId}`), enabled: Boolean(selectedUserId) });
  const lessonNames = useMemo(() => new Map(lessons.data.lessons.map(item => [item.slug, item.title])), [lessons.data.lessons]);

  const save = useMutation({ mutationFn: ({ body, oldSlug }: { body: object; oldSlug?: string }) => json(oldSlug ? `/api/lessons/${oldSlug}` : "/api/lessons", { method: oldSlug ? "PATCH" : "POST", body: JSON.stringify(body) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lessons"] }); queryClient.invalidateQueries({ queryKey: ["admin-summary"] }); queryClient.invalidateQueries({ queryKey: ["admin-audit"] }); setEditing(null); setCreating(false); toast.success("Aula salva com sucesso."); }, onError: error => toast.error(error.message) });
  const remove = useMutation({ mutationFn: (slug: string) => json(`/api/lessons/${slug}`, { method: "DELETE" }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["lessons"] }); queryClient.invalidateQueries({ queryKey: ["admin-summary"] }); queryClient.invalidateQueries({ queryKey: ["admin-audit"] }); toast.success("Aula e referências excluídas."); }, onError: error => toast.error(error.message) });
  const changeStatus = useMutation({ mutationFn: ({ id, value }: { id: string; value: string }) => json(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify({ status: value }) }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); queryClient.invalidateQueries({ queryKey: ["admin-summary"] }); queryClient.invalidateQueries({ queryKey: ["admin-audit"] }); toast.success("Status atualizado."); }, onError: error => toast.error(error.message) });

  function submitLesson(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget)); save.mutate({ oldSlug: editing?.slug, body: { ...data, tips: String(data.tips).split("\n").map(item => item.trim()).filter(Boolean), order: Number(data.order) } }); }
  function submitFilters(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setFilters(current => ({ ...current, q: searchDraft.trim(), page: 1 })); }
  const form = editing ?? blank;

  return <div className="admin-shell">
    <section className="admin-dashboard-hero">
      <div className="admin-hero-heading">
        <div><p className="eyebrow">CENTRAL DE GESTÃO</p><h2>Visão da plataforma</h2><p>Acompanhe os dados mais importantes e administre o CuidadOnline.</p></div>
        <nav className="admin-tabs" aria-label="Seções administrativas">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}><Activity size={18}/>Visão geral</button>
          <button className={tab === "content" ? "active" : ""} onClick={() => setTab("content")}><BookOpen size={18}/>Conteúdo</button>
          <button className={tab === "users" ? "active" : ""} onClick={() => setTab("users")}><Users size={18}/>Usuários</button>
        </nav>
      </div>
      {tab === "overview" && <section className="admin-metrics-grid" aria-label="Resumo administrativo">
        <MetricCard label="USUÁRIOS" value={summary.data?.users ?? "—"} detail={`${summary.data?.activeUsers ?? 0} ativos · ${summary.data?.disabledUsers ?? 0} desativados`} icon={Users}/>
        <MetricCard label="NOVOS EM 30 DIAS" value={summary.data?.new30Days ?? "—"} detail={`${summary.data?.new7Days ?? 0} nos últimos 7 dias`} icon={UserCheck}/>
        <MetricCard label="LEITURAS" value={summary.data?.lessonsCompleted ?? "—"} detail="conclusões registradas" icon={CheckCircle2}/>
        <MetricCard label="QUIZZES" value={summary.data?.quizzes ?? "—"} detail={`média de ${summary.data?.averageQuizPercent ?? 0}%`} icon={ClipboardList}/>
      </section>}
    </section>

    {tab === "overview" && <div className="admin-dashboard-body">
      <div className="admin-overview-grid">
        <section className="panel"><div className="admin-section-heading"><div><p className="eyebrow">ATIVIDADE GERAL</p><h2>Uso da plataforma</h2></div><Activity color="#1554ed"/></div><p className="muted mt-3">{summary.data?.usersWithActivity ?? 0} usuário(s) com atividade · {summary.data?.simulations ?? 0} simulação(ões) concluída(s).</p><div className="mt-5 grid gap-3">{summary.data?.popularLessons.length ? summary.data.popularLessons.map(item => <div className="admin-popular-row" key={item.slug}><span>{lessonNames.get(item.slug) ?? item.slug}</span><strong>{item.visits} acesso(s)</strong></div>) : <p className="muted">Ainda não há atividades registradas.</p>}</div></section>
        <section className="panel"><div className="admin-section-heading"><div><p className="eyebrow">AUDITORIA</p><h2>Atividade administrativa</h2></div><ShieldCheck color="#1554ed"/></div>{audit.data?.entries.length ? <ol className="activity-list">{audit.data.entries.slice(0, 8).map(entry => <li key={entry.id}><span><strong>{entry.admin?.name ?? "Administrador"}</strong> {actionLabel[entry.action] ?? entry.action}{entry.target ? ` de ${entry.target.name}` : ""}</span><time className="muted text-sm">{dateLabel(entry.createdAt)}</time></li>)}</ol> : <p className="muted mt-4">Ainda não há ações administrativas registradas.</p>}</section>
      </div>
    </div>}

    {tab === "content" && <section className="page-stack"><div className="admin-section-heading"><div><p className="eyebrow">CONTEÚDO EDUCATIVO</p><h2>Aulas publicadas</h2><p className="muted mt-1">Edite o catálogo que aparece na área Aprender.</p></div><Button onClick={() => { setEditing(null); setCreating(true); }}><Plus size={18}/>Nova aula</Button></div>
      {(creating || editing) && <Card><form onSubmit={submitLesson} key={editing?.slug ?? "new"} className="admin-lesson-form"><label>Título<Input name="title" required defaultValue={form.title}/></label><label>Slug<Input name="slug" required pattern="[a-z0-9-]+" defaultValue={form.slug}/></label><label className="wide">Resumo<Input name="summary" required defaultValue={form.summary}/></label><label className="wide">Introdução<Textarea name="intro" required rows={4} defaultValue={form.intro}/></label><label className="wide">Dicas (uma por linha)<Textarea name="tips" required rows={5} defaultValue={Array.isArray(form.tips) ? form.tips.join("\n") : form.tips}/></label><label>Cor<Input name="color" required defaultValue={form.color}/></label><label>Fundo<Input name="background" required defaultValue={form.background}/></label><label>Ordem<Input name="order" type="number" min="0" defaultValue={form.order}/></label><div className="flex items-end gap-3"><Button disabled={save.isPending}>Salvar aula</Button><Button type="button" variant="ghost" onClick={() => { setEditing(null); setCreating(false); }}>Cancelar</Button></div></form></Card>}
      <div className="admin-lessons-list">{lessons.data.lessons.map(item => <Card className="admin-lesson-row" key={item.slug}><span className="admin-lesson-color" style={{ background: item.color }}/><div><h3>{item.title}</h3><p className="muted text-sm">/{item.slug} · ordem {item.order}</p></div><div className="admin-row-actions"><Button variant="secondary" onClick={() => { setCreating(false); setEditing(item); }}><Edit3 size={16}/>Editar</Button><Button variant="danger" disabled={remove.isPending} onClick={() => confirm(`Excluir ${item.title} e todas as referências?`) && remove.mutate(item.slug)}><Trash2 size={16}/>Excluir</Button></div></Card>)}</div>
    </section>}

    {tab === "users" && <section className="page-stack">{selectedUserId ? <div>{selectedUser.isPending ? <Card>Carregando usuário...</Card> : selectedUser.data && <><button className="admin-back" onClick={() => setSelectedUserId(null)}><ChevronLeft size={18}/>Voltar para usuários</button><section className="panel mt-4"><p className="eyebrow">DETALHE DO USUÁRIO</p><h2 className="mt-2 text-2xl font-extrabold">{selectedUser.data.user.name}</h2><p className="muted">{selectedUser.data.user.email}</p><div className="admin-user-facts"><div><span>Status</span><strong>{selectedUser.data.user.status === "active" ? "Ativo" : "Desativado"}</strong></div><div><span>Cadastro</span><strong>{dateLabel(selectedUser.data.user.createdAt)}</strong></div><div><span>Último acesso</span><strong>{dateLabel(selectedUser.data.user.lastLoginAt)}</strong></div></div></section><div className="admin-metrics-grid mt-4"><MetricCard label="LEITURAS" value={selectedUser.data.progress.completed.length} detail="aulas concluídas" icon={CheckCircle2}/><MetricCard label="FAVORITOS" value={selectedUser.data.progress.favorites.length} detail="aulas salvas" icon={BookOpen}/><MetricCard label="QUIZZES" value={selectedUser.data.progress.quizzes.length} detail="tentativas recentes" icon={ClipboardList}/><MetricCard label="SIMULAÇÕES" value={selectedUser.data.progress.simulations.length} detail="tentativas recentes" icon={ShieldCheck}/></div></>}</div> : <><div className="admin-section-heading"><div><p className="eyebrow">USUÁRIOS</p><h2>Contas cadastradas</h2><p className="muted mt-1">Consulte acessos e gerencie o status das contas.</p></div></div><form className="admin-filters" onSubmit={submitFilters}><label><span>Buscar</span><div className="admin-search"><Search size={18}/><Input value={searchDraft} onChange={event => setSearchDraft(event.target.value)} placeholder="Nome ou e-mail"/></div></label><label><span>Status</span><select value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value, page: 1 }))}><option value="">Todos</option><option value="active">Ativos</option><option value="disabled">Desativados</option></select></label><Button type="submit">Filtrar</Button></form><p className="muted text-sm">{users.data?.total ?? 0} conta(s) encontrada(s)</p><div className="admin-table-wrap panel"><table className="admin-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Status</th><th>Cadastro</th><th>Ação</th></tr></thead><tbody>{users.data?.users.map(user => <tr key={user.id}><td><button className="admin-user-link" onClick={() => setSelectedUserId(user.id)}>{user.name}</button></td><td>{user.email}</td><td>{user.role === "admin" ? "Administrador" : "Usuário"}</td><td><span className={`admin-status ${user.status}`}>{user.status === "active" ? "Ativo" : "Desativado"}</span></td><td>{dateLabel(user.createdAt)}</td><td><Button variant="secondary" disabled={user.role === "admin" || changeStatus.isPending} onClick={() => changeStatus.mutate({ id: user.id, value: user.status === "active" ? "disabled" : "active" })}>{user.status === "active" ? "Desativar" : "Reativar"}</Button></td></tr>)}</tbody></table></div><div className="admin-pagination"><Button variant="secondary" disabled={(users.data?.page ?? 1) <= 1} onClick={() => setFilters(current => ({ ...current, page: current.page - 1 }))}><ChevronLeft size={17}/>Anterior</Button><span>Página {users.data?.page ?? 1} de {Math.max(users.data?.pages ?? 1, 1)}</span><Button variant="secondary" disabled={(users.data?.page ?? 1) >= (users.data?.pages ?? 1)} onClick={() => setFilters(current => ({ ...current, page: current.page + 1 }))}>Próxima<ChevronRight size={17}/></Button></div></>}</section>}
  </div>;
}
