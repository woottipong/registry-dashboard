import type { ImageConfig, ImageManifest } from "@/types/manifest"
import type {
  ProviderCapabilities,
  RegistryConnection,
  RegistryProviderType,
  Repository,
  Tag,
} from "@/types/registry"

export interface ListOptions {
  page?: number
  perPage?: number
  last?: string
  query?: string
}

export interface PaginatedResult<T> {
  items: T[]
  page: number
  perPage: number
  total?: number
  nextCursor?: string | null
}

export interface RegistryProvider {
  type: RegistryProviderType
  ping(): Promise<boolean>
  listRepositories(options?: ListOptions): Promise<PaginatedResult<Repository>>
  listTags(repo: string, options?: ListOptions): Promise<PaginatedResult<Tag>>
  getManifest(repo: string, ref: string): Promise<ImageManifest>
  getConfig(repo: string, digest: string): Promise<ImageConfig>
  deleteManifest(repo: string, digest: string): Promise<void>
  searchRepositories(query: string): Promise<PaginatedResult<Repository>>
  authenticate(): Promise<void>
  capabilities(): ProviderCapabilities
}

export class UnsupportedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnsupportedError"
  }
}

export interface ProviderContext {
  connection: RegistryConnection
}
