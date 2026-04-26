/**
 * Centralised TanStack Query key factory.
 *
 * Convention: [entity, ...params]
 * Every hook MUST use these builders so invalidation stays consistent.
 */

export const queryKeys = {
    // ── Registries ──────────────────────────────────────────────
    registries: {
        all: ["registries"] as const,
        byId: (id: string) => ["registries", id] as const,
    },

    // ── Namespaces ──────────────────────────────────────────────
    namespaces: {
        byRegistry: (registryId: string) => ["namespaces", registryId] as const,
    },

    // ── Repositories ────────────────────────────────────────────
    repositories: {
        byRegistry: (
            registryId: string,
            page: number,
            perPage: number,
            search: string,
            namespace: string,
        ) => ["repositories", registryId, page, perPage, search, namespace] as const,

        search: (registryId: string, query: string) =>
            ["repositories", "search", registryId, query] as const,

        /** Prefix key — handy for `invalidateQueries` after delete */
        prefix: (registryId: string) => ["repositories", registryId] as const,
    },

    // ── Tags ────────────────────────────────────────────────────
    tags: {
        byRepo: (registryId: string, repoName: string, page = 1, perPage = 50) =>
            ["tags", registryId, repoName, page, perPage] as const,

        /** Prefix key — handy for `invalidateQueries` / `cancelQueries` */
        prefix: (registryId: string, repoName: string) =>
            ["tags", registryId, repoName] as const,
    },

    // ── Manifests ───────────────────────────────────────────────
    manifests: {
        byRef: (registryId: string, repoName: string, ref: string) =>
            ["manifest", registryId, repoName, ref] as const,
    },
    // ── Activities ──────────────────────────────────────────────
    activities: {
        all: ["activities"] as const,
    },
} as const
