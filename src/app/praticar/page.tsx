import type { Metadata } from "next"; import { getQuestions } from "@/lib/content"; import { Quiz } from "@/components/quiz";
export const dynamic="force-dynamic"; export const metadata:Metadata={title:"Praticar"};
export default async function PracticePage(){const questions=await getQuestions();return <div className="container-page py-12"><p className="eyebrow">Quiz educativo</p><h1 className="mb-8 mt-3 text-3xl font-black">Treine seu olhar</h1><Quiz questions={questions}/></div>}
