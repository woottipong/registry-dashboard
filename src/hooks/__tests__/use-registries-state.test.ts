import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useRegistriesState } from '@/hooks/use-registries-state'
import { useRegistries, useDeleteRegistry, useSetDefaultRegistry, usePingRegistry } from '@/hooks/use-registries'
import type { RegistryConnection } from '@/types/registry'

// Mock the hooks
vi.mock('@/hooks/use-registries')
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUseRegistries = vi.mocked(useRegistries)
const mockUseDeleteRegistry = vi.mocked(useDeleteRegistry)
const mockUseSetDefaultRegistry = vi.mocked(useSetDefaultRegistry)
const mockUsePingRegistry = vi.mocked(usePingRegistry)

// Mock Next.js router
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('useRegistriesState', () => {
  const mockRegistries: RegistryConnection[] = [
    {
      id: 'registry-1',
      name: 'Test Registry',
      url: 'https://registry.test.com',
      provider: 'generic' as const,
      authType: 'none' as const,
      createdAt: '2024-01-01T00:00:00Z',
      isDefault: true,
      capabilities: {
        canDelete: true,
        canSearch: true,
        hasRateLimit: false,
        canListCatalog: true,
      },
    },
    {
      id: 'registry-2',
      name: 'Another Registry',
      url: 'https://another.test.com',
      provider: 'dockerhub' as const,
      authType: 'basic' as const,
      createdAt: '2024-01-01T00:00:00Z',
      isDefault: false,
      capabilities: {
        canDelete: false,
        canSearch: true,
        hasRateLimit: true,
        canListCatalog: true,
      },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mocks
    mockUseRegistries.mockReturnValue({
      data: mockRegistries,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRegistries>)

    mockUseDeleteRegistry.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useDeleteRegistry>)

    mockUseSetDefaultRegistry.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useSetDefaultRegistry>)

    mockUsePingRegistry.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePingRegistry>)
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useRegistriesState())

    expect(result.current.registries).toEqual(mockRegistries)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.hasRegistries).toBe(true)
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.hasError).toBe(false)
  })

  it('should not pass empty initialData when no initial registries are provided', () => {
    renderHook(() => useRegistriesState())

    expect(mockUseRegistries).toHaveBeenCalledWith(undefined)
  })

  it('should handle delete registry', () => {
    const mockMutate = vi.fn()
    mockUseDeleteRegistry.mockReturnValue({
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useDeleteRegistry>)

    const { result } = renderHook(() => useRegistriesState())
    result.current.handleDelete('registry-1')

    expect(mockMutate).toHaveBeenCalledWith('registry-1')
  })

  it('should handle set default registry', () => {
    const mockMutate = vi.fn()
    mockUseSetDefaultRegistry.mockReturnValue({
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useSetDefaultRegistry>)

    const { result } = renderHook(() => useRegistriesState())
    result.current.handleSetDefault('registry-1')

    // Implementation calls mutate with only the data argument (no callback)
    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'registry-1', registry: mockRegistries[0] },
    )
  })

  it('should compute empty state correctly', () => {
    // Test with no registries
    mockUseRegistries.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRegistries>)

    const { result } = renderHook(() => useRegistriesState())

    expect(result.current.hasRegistries).toBe(false)
    expect(result.current.isEmpty).toBe(true)
  })

  it('should compute error state correctly', () => {
    // Test with error
    mockUseRegistries.mockReturnValue({
      data: [],
      isLoading: false,
      isError: true,
    } as unknown as ReturnType<typeof useRegistries>)

    const { result } = renderHook(() => useRegistriesState())

    expect(result.current.hasError).toBe(true)
  })

  it('should handle loading state', () => {
    // Test with loading
    mockUseRegistries.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useRegistries>)

    const { result } = renderHook(() => useRegistriesState())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.hasRegistries).toBe(false)
    expect(result.current.isEmpty).toBe(false)
  })

  it('should work with initial registries', () => {
    const { result } = renderHook(() =>
      useRegistriesState({ initialRegistries: mockRegistries })
    )

    expect(result.current.registries).toEqual(mockRegistries)
    expect(result.current.hasRegistries).toBe(true)
  })
})
