"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BookOpen, CircleHelp, Gauge, Heart, Home, LogIn, Menu, MessageCircleQuestion, ShieldCheck, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
const links = [["/", "Início", Home], ["/aprender", "Aprender", BookOpen], ["/praticar", "Praticar", MessageCircleQuestion], ["/simulacoes", "Simulações", ShieldCheck], ["/ajuda", "Ajuda", CircleHelp]] as const;
function Brand() { return <Link href="/" className="flex items-center gap-3 no-underline"><span className="brand-mark"><ShieldCheck size={21}/></span><span className="brand-name">Cuidad<strong>O</strong>nline</span></Link>; }
export function SiteHeader() {
  const { data } = useSession(); const pathname = usePathname(); const [open, setOpen] = useState(false);
  if (pathname === "/entrar" || pathname === "/cadastro") return null;
  const allLinks = [...links, ...(data?.user ? [["/progresso", "Progresso", Gauge] as const, ["/conta", "Minha conta", UserRound] as const] : []), ...(data?.user?.role === "admin" ? [["/admin", "Administração", ShieldCheck] as const] : [])];
  const navigation = allLinks.map(([href,label,Icon]) => <Link key={href} href={href} onClick={()=>setOpen(false)} className={`site-nav-link ${pathname === href || (href !== "/" && pathname.startsWith(href)) ? "active" : ""}`}><Icon size={20} aria-hidden/><span>{label}</span></Link>);
  return <><aside className="site-sidebar"><Brand/><p className="sidebar-caption">SEU ESPAÇO</p><nav className="site-nav" aria-label="Navegação principal">{navigation}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><Heart size={19} color="#1554ed"/><p><strong>Na dúvida, pare e confira.</strong></p><p>Você não precisa decidir com pressa.</p></div>{data?.user ? <Button variant="ghost" className="w-full" onClick={()=>signOut({callbackUrl:"/"})}>Sair</Button> : <Button asChild className="w-full"><Link href="/entrar"><LogIn size={18}/>Entrar</Link></Button>}</div></aside><header className="site-topbar"><div className="mobile-brand"><Brand/></div><Link href="/ajuda" className="hidden font-semibold lg:block">Preciso de ajuda</Link><div className="flex items-center gap-3"><span className="hidden text-sm font-semibold sm:inline">{data?.user?.name ?? "Visitante"}</span><span className="grid h-10 w-10 place-items-center rounded-full bg-[#e2e8f0] font-bold text-[#172b4d]">{data?.user?.name?.charAt(0).toUpperCase() ?? "V"}</span><button className="menu-button h-11 w-11 items-center justify-center rounded-[10px] bg-[#eff5ff] text-[#1554ed]" onClick={()=>setOpen(!open)} aria-label="Abrir menu" aria-expanded={open}><Menu/></button></div><nav className={`mobile-navigation ${open ? "open" : ""}`} aria-label="Navegação móvel">{navigation}{data?.user ? <button className="site-nav-link" onClick={()=>signOut({callbackUrl:"/"})}><LogIn size={20}/><span>Sair</span></button> : <Link className="site-nav-link" href="/entrar" onClick={()=>setOpen(false)}><LogIn size={20}/><span>Entrar</span></Link>}</nav></header></>;
}
