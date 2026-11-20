import {notFound} from "next/navigation";import {getSimulations} from "@/lib/content";import {SimulationPlayer} from "@/components/simulation-player";
export const dynamic="force-dynamic";
export default async function SimulationPage({params}:{params:Promise<{slug:string}>}){const slug=(await params).slug;const simulation=(await getSimulations()).find(x=>x.slug===slug);if(!simulation)notFound();return <div className="container-page py-12"><SimulationPlayer simulation={simulation}/></div>}
