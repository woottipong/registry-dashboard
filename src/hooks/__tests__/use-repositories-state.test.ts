import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useRepositoriesState } from '@/hooks/use-repositories-state'
import { useRegistries } from '@/hooks/use-registries'
import { useRepositories, useSearchRepositories } from '@/hooks/use-repositories'
import type { RegistryConnection } from '@/types/registry'

// Mock the hooks
vi.mock('@/hooks/use-registries')
vi.mock('@/hooks/use-repositories')

const mockUseRegistries = vi.mocked(useRegistries)
const mockUseRepositories = vi.mocked(useRepositories)
const mockUseSearchRepositories = vi.mocked(useSearchRepositories)

// Mock Next.js router
const mockPush = vi.fn()
const mockUseRouter = vi.fn(() => ({
  push: mockPush,
}))

const mockUsePathname = vi.fn(() => '/repos')
const mockUseSearchParams = vi.fn(() => ({
  get: vi.fn(),
  toString: vi.fn(() => ''),
}))

vi.mock('next/navigation', () => ({
  useRouter: mockUseRouter,
  usePathname: mockUsePathname,
  useSearchParams: mockUseSearchParams,
}))

// Mock timers
vi.useFakeTimers()

describe('useRepositoriesState', () => {
  const initialRegistry = 'registry-1'
  const initialRegistries: RegistryConnection[] = [
    {
      id: 'registry-1',
      name: 'Test Registry',
      url: 'https://registry.test.com',
      provider: 'generic' as const,
      authType: 'none' as const,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    mockUseRegistries.mockReturnValue({
      data: initialRegistries,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useRegistries>)

    mockUseRepositories.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRepositories>)

    mockUseSearchRepositories.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSearchRepositories>)
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    expect(result.current.search).toBe('')
    expect(result.current.debouncedSearch).toBe('')
    expect(result.current.selectedRegistry).toBe(initialRegistry)
    expect(result.current.registries).toEqual(initialRegistries)
    expect(result.current.repositories).toEqual([])
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
    expect(result.current.hasSearch).toBe(false)
    expect(result.current.isEmpty).toBe(true)
    expect(result.current.hasError).toBe(false)
  })

  it('should handle search input changes', async () => {
    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    result.current.handleSearchChange({
      target: { value: 'test' }
    } as React.ChangeEvent<HTMLInputElement>)

    expect(result.current.search).toBe('test')
    expect(result.current.hasSearch).toBe(true)

    // Wait for debounce
    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(result.current.debouncedSearch).toBe('test')
    })
  })

  it('should clear search', () => {
    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    // Set search first
    result.current.handleSearchChange({
      target: { value: 'test' }
    } as React.ChangeEvent<HTMLInputElement>)

    expect(result.current.search).toBe('test')

    // Clear search
    result.current.clearSearch()

    expect(result.current.search).toBe('')
    expect(result.current.hasSearch).toBe(false)
  })

  it('should handle registry change', () => {
    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    result.current.handleRegistryChange('registry-2')

    expect(mockPush).toHaveBeenCalledWith('/repos?registry=registry-2')
  })

  it('should use search results when searching', async () => {
    const searchResults = { items: [{ name: 'search-result' }] }
    
    mockUseSearchRepositories.mockReturnValue({
      data: searchResults,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useSearchRepositories>)

    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    // Trigger search
    result.current.handleSearchChange({
      target: { value: 'test' }
    } as React.ChangeEvent<HTMLInputElement>)

    // Wait for debounce
    vi.advanceTimersByTime(300)

    await waitFor(() => {
      expect(result.current.repositories).toEqual(searchResults.items)
    })
  })

  it('should use regular results when not searching', () => {
    const regularResults = { items: [{ name: 'regular-result' }] }
    
    mockUseRepositories.mockReturnValue({
      data: regularResults,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRepositories>)

    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    expect(result.current.repositories).toEqual(regularResults.items)
  })

  it('should handle loading state', () => {
    mockUseRepositories.mockReturnValue({
      data: { items: [] },
      isLoading: true,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRepositories>)

    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    expect(result.current.isLoading).toBe(true)
  })

  it('should handle error state', () => {
    mockUseRepositories.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRepositories>)

    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    expect(result.current.isError).toBe(true)
    expect(result.current.hasError).toBe(true)
  })

  it('should call refetch on both queries', () => {
    const mockRefetch = vi.fn()
    const mockSearchRefetch = vi.fn()
    
    mockUseRepositories.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useRepositories>)

    mockUseSearchRepositories.mockReturnValue({
      data: { items: [] },
      isLoading: false,
      isError: false,
      refetch: mockSearchRefetch,
    } as unknown as ReturnType<typeof useSearchRepositories>)

    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    result.current.refetch()

    expect(mockRefetch).toHaveBeenCalled()
    expect(mockSearchRefetch).not.toHaveBeenCalled() // Should not call search refetch when no search

    // Set search and try again
    result.current.handleSearchChange({
      target: { value: 'test' }
    } as React.ChangeEvent<HTMLInputElement>)

    vi.advanceTimersByTime(300)

    result.current.refetch()

    expect(mockSearchRefetch).toHaveBeenCalled() // Should call search refetch when searching
  })

  it('should determine empty state correctly', () => {
    const { result } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    // Initially empty (no repositories, not loading)
    expect(result.current.isEmpty).toBe(true)

    // Not empty when there are repositories
    mockUseRepositories.mockReturnValue({
      data: { items: [{ name: 'repo1' }] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useRepositories>)

    // Re-render to get updated state
    const { result: result2 } = renderHook(() => 
      useRepositoriesState({ initialRegistry, initialRegistries })
    )

    expect(result2.current.isEmpty).toBe(false)
  })
})
