import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return <div className="container-page py-20 text-center"><p className="eyebrow">Página não encontrada</p><h1 className="mt-3 text-3xl font-black">Este caminho não existe</h1><Button asChild className="mt-6"><Link href="/inicio">Voltar ao início</Link></Button></div>;
}
