import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with Tailwind CSS conflict resolution.
 * This is a standard utility for all Dailie widgets.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
