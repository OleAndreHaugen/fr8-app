import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper function to get the correct asset path based on environment
export function getAssetPath(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In production with basePath, we need to include the basePath
  if (process.env.NODE_ENV === 'production') {
    return `/webapp/chat/${cleanPath}`;
  }
  
  // In development, use relative path
  return `/${cleanPath}`;
} 