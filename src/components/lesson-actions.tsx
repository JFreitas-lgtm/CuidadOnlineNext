"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Progress } from "@/types";

async function request(url: string, init?: RequestInit) { const response = await fetch(url, { ...init, headers: { "content-type": "application/json", ...init?.headers } }); if (!response.ok) throw new Error("Não foi possível salvar."); return response.status === 204 ? null : response.json(); }

export function LessonActions({ slug, title, shareText }: { slug: string; title: string; shareText: string }) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { data } = useQuery<Progress>({ queryKey: ["progress"], queryFn: () => request("/api/progress"), enabled: Boolean(session), staleTime: 0 });
  const mutation = useMutation({ mutationFn: (body: object) => request(`/api/progress/lessons/${slug}`, { method: "PATCH", body: JSON.stringify(body) }), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["progress"] }); toast.success("Progresso atualizado."); }, onError: () => toast.error("Não foi possível salvar agora.") });
  const favorite = data?.favorites.includes(slug);
  const completed = data?.completed.includes(slug);
  return <div className="lesson-actions">
    {session ? <><Button className={`lesson-favorite ${favorite ? "active" : ""}`} disabled={mutation.isPending} onClick={() => mutation.mutate({ favorite: !favorite })}>{favorite ? "Remover dos favoritos" : "Favoritar aula"}</Button><Button className="lesson-complete" disabled={mutation.isPending || completed} onClick={() => mutation.mutate({ completed: true })}>{completed ? "Aula concluída" : mutation.isPending ? "Salvando..." : "Marcar como concluída"}</Button></> : <Button asChild><a href="/entrar">Entre para salvar</a></Button>}
    <Button className="lesson-share" onClick={async () => { if (navigator.share) await navigator.share({ title, text: shareText }); else { await navigator.clipboard.writeText(shareText); toast.success("Dicas copiadas."); } }}>Compartilhar dicas</Button>
  </div>;
}
