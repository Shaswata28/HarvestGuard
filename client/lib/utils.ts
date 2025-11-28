import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toBanglaDigits(str: string | number): string {
  const numberStr = String(str);
  const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return numberStr.replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
}