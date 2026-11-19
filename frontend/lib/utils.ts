import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBasePath(): string {
  if (typeof window !== "undefined") {
    if (window.location.pathname.startsWith("/auditor-ai-twin")) {
      return "/auditor-ai-twin"
    }
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || ""
}

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "N/A"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return dateStr
  }
}
