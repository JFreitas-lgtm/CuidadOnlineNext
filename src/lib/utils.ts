import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T; }
export function apiError(code: string, message: string, status = 400, fields?: Record<string, string[]>) {
  return Response.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}
