
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to ensure it has leading zeros
 * e.g., "2023-5-1" becomes "2023-05-01"
 */
export function formatDateString(dateString: string): string {
  return dateString.replace(/\b(\d)\b/g, "0$1");
}

/**
 * Ensures a time string has proper format with leading zeros
 * e.g., "9:5" becomes "09:05"
 */
export function formatTimeString(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const formattedHours = hours.padStart(2, '0');
  const formattedMinutes = minutes ? minutes.padStart(2, '0') : '00';
  return `${formattedHours}:${formattedMinutes}`;
}
