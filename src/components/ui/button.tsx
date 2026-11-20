import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
const styles = cva("inline-flex min-h-[50px] items-center justify-center rounded-[10px] px-[18px] py-[14px] text-[.9375rem] font-semibold no-underline transition disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[#1554ed] !text-white hover:bg-[#1046ce]", secondary: "border border-[#dfe9ff] bg-[#eff5ff] !text-[#1554ed] hover:bg-[#e3edff]", danger: "bg-[#a12626] !text-white hover:bg-[#861d1d]", ghost: "!text-[#1554ed] hover:bg-[#eff5ff]" } }, defaultVariants: { variant: "default" } });
export function Button({ className, variant, asChild, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof styles> & { asChild?: boolean }) { const Comp = asChild ? Slot : "button"; return <Comp className={cn(styles({ variant }), className)} {...props} />; }
