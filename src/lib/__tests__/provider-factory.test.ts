import { describe, it, expect } from "vitest"
import { createProvider, GenericProvider, DockerHubProvider } from "@/lib/providers"
import type { RegistryConnection } from "@/types/registry"

const BASE: RegistryConnection = {
  id: "test",
  name: "Test Registry",
  url: "https://registry.example.com",
  provider: "generic",
  authType: "none",
  createdAt: new Date().toISOString(),
}

describe("createProvider()", () => {
  it("returns GenericProvider when provider is 'generic'", () => {
    const provider = createProvider({ ...BASE, provider: "generic" })
    expect(provider).toBeInstanceOf(GenericProvider)
  })

  it("returns DockerHubProvider when provider is 'dockerhub'", () => {
    const provider = createProvider({ ...BASE, provider: "dockerhub", url: "https://registry-1.docker.io" })
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("auto-detects DockerHub from registry-1.docker.io URL", () => {
    // provider field omitted — falls back to URL detection
    const conn = { ...BASE, url: "https://registry-1.docker.io" } as RegistryConnection
    // @ts-expect-error — testing runtime auto-detection without provider field
    delete conn.provider
    const provider = createProvider(conn)
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("auto-detects DockerHub from docker.io URL", () => {
    const conn = { ...BASE, url: "https://docker.io" } as RegistryConnection
    // @ts-expect-error — testing runtime auto-detection without provider field
    delete conn.provider
    const provider = createProvider(conn)
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("auto-detects DockerHub case-insensitively", () => {
    const conn = { ...BASE, url: "https://REGISTRY-1.DOCKER.IO" } as RegistryConnection
    // @ts-expect-error
    delete conn.provider
    const provider = createProvider(conn)
    expect(provider).toBeInstanceOf(DockerHubProvider)
  })

  it("defaults to GenericProvider for unknown URL when no provider set", () => {
    const conn = { ...BASE, url: "https://registry.mycompany.com" } as RegistryConnection
    // @ts-expect-error
    delete conn.provider
    const provider = createProvider(conn)
    expect(provider).toBeInstanceOf(GenericProvider)
  })

  it("explicit 'generic' provider takes precedence over docker.io URL", () => {
    const provider = createProvider({ ...BASE, provider: "generic", url: "https://docker.io" })
    expect(provider).toBeInstanceOf(GenericProvider)
  })

  it("returns GenericProvider for non-dockerhub provider types", () => {
    const provider = createProvider({ ...BASE, provider: "ghcr" })
    expect(provider).toBeInstanceOf(GenericProvider)
  })
})

describe("GenericProvider.capabilities()", () => {
  it("reports correct capabilities", () => {
    const provider = createProvider(BASE)
    const caps = provider.capabilities()
    expect(caps.canListCatalog).toBe(true)
    expect(caps.canDelete).toBe(true)
    expect(caps.canSearch).toBe(false)
    expect(caps.hasRateLimit).toBe(false)
  })
})

describe("DockerHubProvider.capabilities()", () => {
  it("reports delete as unsupported", () => {
    const provider = createProvider({ ...BASE, provider: "dockerhub", url: "https://registry-1.docker.io" })
    const caps = provider.capabilities()
    expect(caps.canDelete).toBe(false)
    expect(caps.canSearch).toBe(true)
    expect(caps.hasRateLimit).toBe(true)
  })
})
