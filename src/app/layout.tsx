import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
export const metadata: Metadata = { title: { default: "CuidadOnline", template: "%s | CuidadOnline" }, description: "Aprenda a reconhecer e evitar golpes digitais." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="pt-BR" data-scroll-behavior="smooth"><body><Providers><div className="app-shell"><SiteHeader/><div className="workspace"><main>{children}</main><Footer/></div></div></Providers></body></html>; }
