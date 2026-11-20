"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function Footer() { const pathname=usePathname(); if(pathname==="/entrar"||pathname==="/cadastro")return null; return <footer className="mt-16 border-t border-[#e5ebf3] bg-white"><div className="container-page grid gap-6 py-8 md:grid-cols-2"><div><p className="font-extrabold text-[#172b4d]">♡ Aprender a se proteger também é cuidar de quem você ama.</p><p className="muted mt-2 max-w-lg text-sm">CuidadOnline · Educação e segurança digital</p></div><nav className="flex flex-wrap gap-4 md:justify-end" aria-label="Links do rodapé"><Link href="/glossario">Glossário</Link><Link href="/ajuda">Preciso de ajuda</Link><Link href="/cadastro">Criar conta</Link></nav></div></footer>; }
