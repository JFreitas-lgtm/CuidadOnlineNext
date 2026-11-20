"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) { return <div className="container-page py-16"><div className="panel mx-auto max-w-xl p-8 text-center"><p className="eyebrow">Não foi possível carregar</p><h1 className="mt-3 text-2xl font-black">Tivemos um problema temporário</h1><p className="muted my-4">Confira sua conexão e tente novamente.</p><Button onClick={reset}>Tentar novamente</Button></div></div>; }
