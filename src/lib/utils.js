// Utility: cn() merges Tailwind class names with clsx + tailwind-merge
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
