
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, UseFormProps, UseFormReturn } from "react-hook-form";
import { z } from "zod";

/**
 * Create a form with standardized configuration
 */
export function useZodForm<TSchema extends z.ZodType>(
  schema: TSchema,
  options: Omit<UseFormProps<z.infer<TSchema>>, "resolver"> = {}
): UseFormReturn<z.infer<TSchema>> {
  return useForm<z.infer<TSchema>>({
    ...options,
    resolver: zodResolver(schema),
  });
}

/**
 * Format a URL with proper protocol if missing
 */
export function formatUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  url = url.trim();
  if (url.length === 0) return null;
  
  if (!url.match(/^https?:\/\//i)) {
    return `https://${url}`;
  }
  
  return url;
}

/**
 * Clean form data by removing empty strings and converting them to null
 */
export function cleanFormData<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  
  Object.keys(result).forEach(key => {
    const value = result[key as keyof T];
    // Convert empty strings to null
    if (typeof value === "string" && value.trim() === "") {
      (result as Record<string, any>)[key] = null;
    }
  });
  
  return result;
}
