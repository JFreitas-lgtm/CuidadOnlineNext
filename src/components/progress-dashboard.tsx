"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Lesson, Progress } from "@/types";

async function getProgress() { const response = await fetch("/api/progress", { cache: "no-store" }); if (!response.ok) throw new Error("Não foi possível carregar o progresso."); return response.json() as Promise<Progress>; }

export function ProgressDashboard({ lessons }: { lessons: Lesson[] }) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["progress"], queryFn: getProgress, staleTime: 0, refetchOnMount: "always", refetchOnWindowFocus: true });
  const clear = useMutation({ mutationFn: async () => { const response = await fetch("/api/progress", { method: "DELETE" }); if (!response.ok) throw new Error("Não foi possível apagar o progresso."); }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["progress"] }); toast.success("Seu progresso foi apagado."); }, onError: (error) => toast.error(error.message) });
  if (query.isPending) return <Card className="animate-pulse">Carregando seu relatório...</Card>;
  if (query.isError) return <Card><p className="font-bold">Não foi possível carregar seu progresso.</p><Button className="mt-4" onClick={() => query.refetch()}>Tentar novamente</Button></Card>;
  const progress = query.data;
  const nextLesson = lessons.find((lesson) => !progress.completed.includes(lesson.slug));
  const favorites = lessons.filter((lesson) => progress.favorites.includes(lesson.slug));
  return <div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Card><p className="eyebrow">Leituras</p><p className="mt-2 text-3xl font-black">{progress.completed.length}/{lessons.length}</p></Card><Card><p className="eyebrow">Quizzes</p><p className="mt-2 text-3xl font-black">{progress.quizAttempts}</p></Card><Card><p className="eyebrow">Melhor quiz</p><p className="mt-2 text-3xl font-black">{progress.bestQuiz ? `${progress.bestQuiz.score}/${progress.bestQuiz.total}` : "—"}</p></Card><Card><p className="eyebrow">Simulações</p><p className="mt-2 text-3xl font-black">{progress.simulationAttempts}</p></Card></div>
    {nextLesson && <Card className="mt-6"><h2 className="text-xl font-black">Continue aprendendo</h2><p className="muted mt-2">Próximo assunto: {nextLesson.title}</p><Button asChild className="mt-4"><Link href={`/aprender/${nextLesson.slug}`}>Abrir aula</Link></Button></Card>}
    <Card className="mt-6"><h2 className="text-xl font-black">Favoritos</h2><div className="mt-4 flex flex-wrap gap-3">{favorites.map((lesson) => <Button asChild variant="secondary" key={lesson.slug}><Link href={`/aprender/${lesson.slug}`}>{lesson.title}</Link></Button>)}{favorites.length === 0 && <p className="muted">Você ainda não favoritou aulas.</p>}</div></Card>
    <Button variant="danger" className="mt-8" disabled={clear.isPending} onClick={() => confirm("Apagar todo o progresso?") && clear.mutate()}>{clear.isPending ? "Apagando..." : "Apagar meu progresso"}</Button>
  </div>;
}
