export interface ApiError {
  code: string
  message: string
  details?: unknown
  userMessage?: string
}

export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
  nextCursor?: string | null
  prevCursor?: string | null
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error: ApiError | null
  meta?: PaginationMeta
}
