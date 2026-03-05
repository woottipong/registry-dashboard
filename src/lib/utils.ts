import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Encode each segment of a repository path (e.g. "library/nginx")
 * while preserving the "/" separators.
 */
export function encodeRepoPath(repoName: string): string {
  return repoName
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}
