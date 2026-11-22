"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

export function Footer() {
  const pathname = usePathname();
  const { data } = useSession();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  if (!mounted || pathname === "/" || pathname === "/entrar" || pathname === "/cadastro") return null;
  return <footer className="site-footer"><div className="container-page footer-inner"><div><p className="footer-message">♡ Aprender a se proteger também é cuidar de quem você ama.</p><p className="muted mt-2 text-sm">CuidadOnline · Educação e segurança digital</p></div><nav className="footer-links" aria-label="Links do rodapé"><Link href="/glossario">Glossário</Link><Link href="/ajuda">Preciso de ajuda</Link><Link href={data?.user ? "/conta" : "/cadastro"}>{data?.user ? "Minha conta" : "Criar conta"}</Link></nav></div></footer>;
}
