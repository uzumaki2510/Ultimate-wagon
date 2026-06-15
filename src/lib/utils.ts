import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusColor(status: string): string {
  const s = status?.toLowerCase() || "";
  if (s.includes("cut off") || s.includes("sick")) return "text-red-700 bg-red-100 border-red-200";
  if (s.includes("under repair") || s.includes("repair")) return "text-orange-700 bg-orange-100 border-orange-200";
  if (s.includes("awaiting inspection") || s.includes("inspection")) return "text-blue-700 bg-blue-100 border-blue-200";
  if (s.includes("fit") || s.includes("completed")) return "text-green-700 bg-green-100 border-green-200";
  if (s.includes("archived")) return "text-gray-700 bg-gray-100 border-gray-200";
  return "text-gray-700 bg-gray-100 border-gray-200"; // default
}
