export interface ManifestBlobReference {
  mediaType: string
  size: number
  digest: string
}

export interface ImageManifest {
  schemaVersion: number
  mediaType: string
  digest: string
  config: ManifestBlobReference
  layers: ManifestBlobReference[]
  totalSize: number
}

export interface ManifestIndexEntry {
  mediaType: string
  size: number
  digest: string
  platform?: {
    architecture: string
    os: string
    variant?: string
  }
}

export interface ImageIndex {
  schemaVersion: number
  mediaType: string
  digest?: string
  manifests: ManifestIndexEntry[]
}

export interface ImageConfigRuntime {
  Hostname?: string
  Env?: string[]
  Cmd?: string[]
  Entrypoint?: string[]
  Labels?: Record<string, string>
  ExposedPorts?: Record<string, unknown>
  Volumes?: Record<string, unknown>
  WorkingDir?: string
  User?: string
}

export interface ImageConfigHistory {
  created?: string
  created_by?: string
  author?: string
  comment?: string
  empty_layer?: boolean
}

export interface ImageConfig {
  architecture: string
  os: string
  created: string
  author?: string
  config: ImageConfigRuntime
  history?: ImageConfigHistory[]
  rootfs?: {
    type: string
    diff_ids: string[]
  }
}
