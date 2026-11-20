"use client";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useUIStore } from "@/store/ui";
import type { Lesson } from "@/types";
export function LessonBrowser({ lessons }: { lessons: Lesson[] }) { const { lessonSearch, setLessonSearch } = useUIStore(); const normalized = lessonSearch.toLocaleLowerCase("pt-BR"); const visible = lessons.filter(x => `${x.title} ${x.summary} ${x.intro}`.toLocaleLowerCase("pt-BR").includes(normalized)); return <><label className="relative block max-w-lg"><span className="sr-only">Buscar aula</span><Search className="absolute left-4 top-3 text-slate-400" size={20}/><Input className="pl-11" type="search" value={lessonSearch} onChange={e => setLessonSearch(e.target.value)} placeholder="Busque Pix, boleto, WhatsApp..."/></label><p className="muted mt-3 text-sm" role="status">{visible.length} assunto(s) encontrado(s)</p><div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{visible.map(item => <Card key={item.slug} className="flex flex-col border-t-4" style={{ borderTopColor:item.color }}><Star size={20} style={{ color:item.color }}/><h2 className="mt-4 text-xl font-black">{item.title}</h2><p className="muted mt-2 flex-1">{item.summary}</p><Button asChild variant="secondary" className="mt-5 w-full"><Link href={`/aprender/${item.slug}`}>Abrir aula</Link></Button></Card>)}</div>{visible.length === 0 && <Card className="mt-7 text-center"><p className="font-bold">Nenhum assunto encontrado.</p><Button variant="ghost" onClick={() => setLessonSearch("")}>Limpar busca</Button></Card>}</>; }
