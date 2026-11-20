import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
const styles = cva("inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-emerald-700 text-white hover:bg-emerald-800", secondary: "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50", danger: "bg-rose-700 text-white hover:bg-rose-800", ghost: "text-emerald-800 hover:bg-emerald-50" } }, defaultVariants: { variant: "default" } });
export function Button({ className, variant, asChild, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles> & { asChild?: boolean }) { const Comp = asChild ? Slot : "button"; return <Comp className={cn(styles({ variant }), className)} {...props} />; }
