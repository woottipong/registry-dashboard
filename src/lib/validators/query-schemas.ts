import { z } from "zod"

/**
 * Shared Zod schema for list-style query parameters used across the v1 API
 * routes (`repositories`, `namespaces`, tags, etc.).
 *
 * Coerces string inputs (from `searchParams`) to the correct types and
 * enforces safe limits to prevent abuse.
 */
export const listQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    perPage: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(200).optional(),
    namespace: z.string().max(200).optional(),
})

export type ListQuery = z.infer<typeof listQuerySchema>
