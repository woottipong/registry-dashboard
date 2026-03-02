import { describe, it, expect } from "vitest"
import { createProvider, GenericProvider, DockerHubProvider } from "@/lib/providers"
import type { RegistryConnection } from "@/types/registry"

const base = (overrides: Partial<RegistryConnection> = {}): RegistryConnection => ({
  id: "test",
  name: "Test",
  url: "http://registry.local:5000",
  provider: "generic",
  authType: "none",
  createdAt: new Date().toISOString(),
  ...overrides,
})

describe("createProvider", () => {
  it("returns GenericProvider for explicit generic provider", () => {
    const provider = createProvider(base({ provider: "generic" }))
    expect(provider).toBeInstanceOf(GenericProvider)
  })

  it("returns DockerHubProvider for explicit dockerhub provider", () => {
    const provider = createProvider(base({ provider: "dockerhub" }))
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("auto-detects dockerhub from registry-1.docker.io URL", () => {
    const provider = createProvider(
      base({ provider: undefined, url: "https://registry-1.docker.io" }),
    )
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("auto-detects dockerhub from docker.io URL", () => {
    const provider = createProvider(base({ provider: undefined, url: "https://docker.io" }))
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("defaults to GenericProvider for unknown URLs", () => {
    const provider = createProvider(base({ provider: undefined, url: "http://my-harbor.internal" }))
    expect(provider).toBeInstanceOf(GenericProvider)
  })
})
