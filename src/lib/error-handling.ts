/**
 * Centralized error handling and user feedback utilities
 */

import type { ApiResponse } from "@/types/api"

// Error codes and their user-friendly messages
export const ERROR_CODES = {
  // Registry errors
  REGISTRY_NOT_FOUND: "Registry not found",
  REGISTRY_CONNECTION_FAILED: "Failed to connect to registry",
  REGISTRY_AUTH_FAILED: "Authentication failed",

  // Repository errors
  REPOSITORY_NOT_FOUND: "Repository not found",
  REPOSITORY_ACCESS_DENIED: "Access denied to repository",

  // Manifest/Tag errors
  MANIFEST_NOT_FOUND: "Image manifest not found",
  MANIFEST_FETCH_FAILED: "Failed to load image manifest",
  TAG_NOT_FOUND: "Image tag not found",

  // Network errors
  NETWORK_ERROR: "Network connection failed",
  TIMEOUT_ERROR: "Request timed out",

  // Validation errors
  VALIDATION_ERROR: "Invalid input data",
  REQUIRED_FIELD_MISSING: "Required field is missing",

  // Generic errors
  UNKNOWN_ERROR: "An unexpected error occurred",
  SERVICE_UNAVAILABLE: "Service temporarily unavailable",
} as const

export type ErrorCode = keyof typeof ERROR_CODES

export interface AppError {
  code: ErrorCode
  message: string
  details?: string
  statusCode?: number
  userMessage?: string
}

/**
 * Create a standardized application error
 */
export function createAppError(
  code: ErrorCode,
  details?: string,
  statusCode?: number
): AppError {
  return {
    code,
    message: ERROR_CODES[code],
    details,
    statusCode,
    userMessage: getUserFriendlyMessage(code, details),
  }
}

/**
 * Convert any error to an AppError
 */
export function normalizeError(error: unknown): AppError {
  if (isAppError(error)) {
    return error
  }

  if (error instanceof Error) {
    // Try to extract error code from message if it follows a pattern
    const codeMatch = error.message.match(/^\[([A-Z_]+)\]/)
    if (codeMatch && codeMatch[1] in ERROR_CODES) {
      return createAppError(codeMatch[1] as ErrorCode, error.message)
    }

    return createAppError('UNKNOWN_ERROR', error.message)
  }

  return createAppError('UNKNOWN_ERROR', String(error))
}

/**
 * Check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as AppError).code === 'string' &&
    typeof (error as AppError).message === 'string'
  )
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(code: ErrorCode, details?: string): string {
  const baseMessage = ERROR_CODES[code]

  switch (code) {
    case 'REGISTRY_AUTH_FAILED':
      return 'Please check your credentials and try again. For Docker Hub, use your username and personal access token.'
    case 'NETWORK_ERROR':
      return 'Please check your internet connection and try again.'
    case 'TIMEOUT_ERROR':
      return 'The request took too long to complete. Please try again.'
    case 'SERVICE_UNAVAILABLE':
      return 'The service is temporarily unavailable. Please try again later.'
    case 'MANIFEST_NOT_FOUND':
      return 'The requested image was not found. Please check the repository and tag name.'
    default:
      return details ? `${baseMessage}: ${details}` : baseMessage
  }
}

/**
 * Log error with appropriate level
 */
export function logError(error: AppError | unknown, context?: string): void {
  const normalizedError = normalizeError(error)
  const logMessage = context ? `[${context}] ${normalizedError.message}` : normalizedError.message

  if (normalizedError.statusCode && normalizedError.statusCode >= 500) {
    console.error(logMessage, normalizedError)
  } else if (normalizedError.statusCode && normalizedError.statusCode >= 400) {
    console.warn(logMessage, normalizedError)
  } else {
    console.info(logMessage, normalizedError)
  }
}

/**
 * Handle API errors and convert to user-friendly format
 */
export function handleApiError(error: unknown, context?: string): AppError {
  const appError = normalizeError(error)
  logError(appError, context)
  return appError
}

/**
 * Assert that an ApiResponse is successful and extract its data.
 * Throws if the response is not ok or `success` is false.
 */
export async function assertApiSuccess<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.error?.message ?? "Request failed")
  }

  return payload.data as T
}
