import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { FormElement } from "./store";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function hasOptions(
  el: FormElement
): el is Extract<FormElement, { options: string[] }> {
  return el.type === 'select' || el.type === 'radio';
}