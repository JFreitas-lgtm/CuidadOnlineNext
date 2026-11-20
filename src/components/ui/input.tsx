import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"; import { cn } from "@/lib/utils";
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) { return <input className={cn("min-h-11 w-full rounded-xl border border-slate-300 bg-white px-4 text-slate-900 placeholder:text-slate-400", className)} {...props} />; }
export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea className={cn("w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900", className)} {...props} />; }
