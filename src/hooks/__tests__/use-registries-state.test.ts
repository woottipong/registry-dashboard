import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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

    expect(result.current.searchQuery).toBe('')
    expect(result.current.registries).toEqual(mockRegistries)
    expect(result.current.filteredRegistries).toEqual(mockRegistries)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.hasRegistries).toBe(true)
    expect(result.current.isEmpty).toBe(false)
    expect(result.current.hasError).toBe(false)
  })

  it('should filter registries based on search query', async () => {
    const { result } = renderHook(() => useRegistriesState())

    // Search by name
    result.current.setSearchQuery('Test')

    await waitFor(() => {
      expect(result.current.filteredRegistries).toHaveLength(1)
      expect(result.current.filteredRegistries[0].name).toBe('Test Registry')
    })

    // Search by URL
    result.current.setSearchQuery('another')

    await waitFor(() => {
      expect(result.current.filteredRegistries).toHaveLength(1)
      expect(result.current.filteredRegistries[0].name).toBe('Another Registry')
    })

    // Search by provider
    result.current.setSearchQuery('dockerhub')

    await waitFor(() => {
      expect(result.current.filteredRegistries).toHaveLength(1)
      expect(result.current.filteredRegistries[0].provider).toBe('dockerhub')
    })

    // Clear search
    result.current.setSearchQuery('')

    await waitFor(() => {
      expect(result.current.filteredRegistries).toHaveLength(2)
    })
  })

  it('should handle delete registry', () => {
    const { result } = renderHook(() => useRegistriesState())
    const mockMutate = vi.fn()
    mockUseDeleteRegistry.mockReturnValue({
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useDeleteRegistry>)

    result.current.handleDelete('registry-1')

    expect(mockMutate).toHaveBeenCalledWith('registry-1', {
      onSuccess: expect.any(Function),
    })
  })

  it('should handle set default registry', () => {
    const { result } = renderHook(() => useRegistriesState())
    const mockMutate = vi.fn()
    mockUseSetDefaultRegistry.mockReturnValue({
      mutate: mockMutate,
    } as unknown as ReturnType<typeof useSetDefaultRegistry>)

    result.current.handleSetDefault('registry-1')

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'registry-1', registry: mockRegistries[0] },
      {
        onSuccess: expect.any(Function),
      }
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
