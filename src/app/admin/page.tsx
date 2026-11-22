import { getLessons } from "@/lib/content";
import { AdminDashboard } from "@/components/admin-dashboard";
export const dynamic = "force-dynamic";
export default async function AdminPage() { return <div className="container-page py-[38px]"><p className="eyebrow">PAINEL ADMINISTRATIVO</p><h1 className="mt-[10px] text-[2rem] font-extrabold tracking-[-.8px]">Administração</h1><p className="muted mt-2">Acompanhe usuários, atividades e conteúdos do CuidadOnline.</p><AdminDashboard initialLessons={await getLessons()}/></div>; }
