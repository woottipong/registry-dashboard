import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RepositorySearch, RegistrySelector, RepositoryLoading, RepositoryError, RepositoryEmpty } from '@/components/repository/repository-ui-components'
import type { RegistryConnection } from '@/types/registry'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  SearchIcon: ({ className }: { className?: string }) => <div data-testid="search-icon" className={className} />,
  PlusIcon: ({ className }: { className?: string }) => <div data-testid="plus-icon" className={className} />,
  AlertTriangleIcon: ({ className }: { className?: string }) => <div data-testid="alert-icon" className={className} />,
  RefreshCwIcon: ({ className }: { className?: string }) => <div data-testid="refresh-icon" className={className} />,
}))

describe('RepositorySearch', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input with placeholder', () => {
    render(<RepositorySearch {...defaultProps} />)

    expect(screen.getByPlaceholderText('Quick search by name or tag...')).toBeInTheDocument()
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('should call onChange when input value changes', () => {
    const mockOnChange = vi.fn()
    render(<RepositorySearch {...defaultProps} onChange={mockOnChange} />)

    const input = screen.getByPlaceholderText('Quick search by name or tag...')
    fireEvent.change(input, { target: { value: 'test' } })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
  })

  it('should show clear button when value is present', () => {
    render(<RepositorySearch {...defaultProps} value="test" />)

    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', () => {
    const mockOnClear = vi.fn()
    render(<RepositorySearch {...defaultProps} value="test" onClear={mockOnClear} />)

    fireEvent.click(screen.getByText('Clear'))

    expect(mockOnClear).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<RepositorySearch {...defaultProps} disabled />)

    expect(screen.getByPlaceholderText('Quick search by name or tag...')).toBeDisabled()
  })
})

describe('RegistrySelector', () => {
  const mockRegistries: RegistryConnection[] = [
    {
      id: 'registry-1',
      name: 'Test Registry',
      url: 'https://registry.test.com',
      provider: 'generic' as const,
      authType: 'none' as const,
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'registry-2',
      name: 'Another Registry',
      url: 'https://another.test.com',
      provider: 'dockerhub' as const,
      authType: 'basic' as const,
      createdAt: '2024-01-01T00:00:00Z',
    },
  ]

  const defaultProps = {
    registries: mockRegistries,
    selectedRegistry: 'registry-1',
    onRegistryChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all registries', () => {
    render(<RegistrySelector {...defaultProps} />)

    expect(screen.getByText('Test Registry')).toBeInTheDocument()
    expect(screen.getByText('Another Registry')).toBeInTheDocument()
  })

  it('should highlight selected registry', () => {
    render(<RegistrySelector {...defaultProps} />)

    const selectedButton = screen.getByText('Test Registry')
    expect(selectedButton).toHaveClass('bg-primary')
  })

  it('should call onRegistryChange when registry is clicked', () => {
    const mockOnChange = vi.fn()
    render(<RegistrySelector {...defaultProps} onRegistryChange={mockOnChange} />)

    fireEvent.click(screen.getByText('Another Registry'))

    expect(mockOnChange).toHaveBeenCalledWith('registry-2')
  })

  it('should show Connect button', () => {
    render(<RegistrySelector {...defaultProps} />)

    expect(screen.getByText('Connect')).toBeInTheDocument()
    expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<RegistrySelector {...defaultProps} disabled />)

    // Only the registry selection buttons are disabled; the Connect button is not
    const registryButtons = screen.getAllByRole('button', { name: /Select .* registry/i })
    registryButtons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })
})

describe('RepositoryLoading', () => {
  it('should render skeleton items', () => {
    const { container } = render(<RepositoryLoading count={3} />)

    const skeletons = container.querySelectorAll('.border-b')
    expect(skeletons.length).toBe(3)
  })

  it('should render default count when not specified', () => {
    const { container } = render(<RepositoryLoading />)

    // 8 rows by default
    const skeletonRows = container.querySelectorAll('.border-b')
    expect(skeletonRows.length).toBe(8)
  })
})

describe('RepositoryError', () => {
  const defaultProps = {
    onRetry: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render error message', () => {
    render(<RepositoryError {...defaultProps} />)

    expect(screen.getByText('Failed to Load Repositories')).toBeInTheDocument()
    expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
  })

  it('should call onRetry when Try Again button is clicked', () => {
    const mockOnRetry = vi.fn()
    render(<RepositoryError {...defaultProps} onRetry={mockOnRetry} />)

    fireEvent.click(screen.getByText('Try Again'))

    expect(mockOnRetry).toHaveBeenCalled()
  })

  it('should display custom message when provided', () => {
    const customMessage = 'Custom error message'
    render(<RepositoryError {...defaultProps} message={customMessage} />)

    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })
})

describe('RepositoryEmpty', () => {
  it('should render search empty state when hasSearch is true', () => {
    render(<RepositoryEmpty hasSearch={true} />)

    expect(screen.getByText('No repositories found matching your search.')).toBeInTheDocument()
  })

  it('should render no registry empty state when hasSearch is false', () => {
    render(<RepositoryEmpty hasSearch={false} />)

    expect(screen.getByText('No Registry Connected')).toBeInTheDocument()
    expect(screen.getByText('Connect a Docker registry to start browsing your container images.')).toBeInTheDocument()
  })

  it('should call onConnectRegistry when Add First Registry button is clicked', () => {
    const mockOnConnect = vi.fn()
    render(<RepositoryEmpty hasSearch={false} onConnectRegistry={mockOnConnect} />)

    fireEvent.click(screen.getByText('Add First Registry'))

    expect(mockOnConnect).toHaveBeenCalled()
  })
})
