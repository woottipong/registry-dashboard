import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegistrySearch, ModernRegistryCard, RegistryLoading, RegistryEmpty, RegistryError } from '@/components/registry/registry-ui-components'
import type { RegistryConnection } from '@/types/registry'

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  SearchIcon: ({ className }: { className?: string }) => <div data-testid="search-icon" className={className} />,
  PlusIcon: ({ className }: { className?: string }) => <div data-testid="plus-icon" className={className} />,
  AlertTriangleIcon: ({ className }: { className?: string }) => <div data-testid="alert-icon" className={className} />,
  RefreshCwIcon: ({ className }: { className?: string }) => <div data-testid="refresh-icon" className={className} />,
  ServerIcon: ({ className }: { className?: string }) => <div data-testid="server-icon" className={className} />,
}))

describe('RegistrySearch', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    onClear: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render search input with placeholder', () => {
    render(<RegistrySearch {...defaultProps} />)
    
    expect(screen.getByPlaceholderText('Search registries...')).toBeInTheDocument()
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('should call onChange when input value changes', () => {
    const mockOnChange = vi.fn()
    render(<RegistrySearch {...defaultProps} onChange={mockOnChange} />)
    
    const input = screen.getByPlaceholderText('Search registries...')
    fireEvent.change(input, { target: { value: 'test' } })
    
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
      target: { value: 'test' }
    }))
  })

  it('should show clear button when value is present', () => {
    render(<RegistrySearch {...defaultProps} value="test" />)
    
    expect(screen.getByText('Clear')).toBeInTheDocument()
  })

  it('should call onClear when clear button is clicked', () => {
    const mockOnClear = vi.fn()
    render(<RegistrySearch {...defaultProps} value="test" onClear={mockOnClear} />)
    
    fireEvent.click(screen.getByText('Clear'))
    
    expect(mockOnClear).toHaveBeenCalled()
  })

  it('should be disabled when disabled prop is true', () => {
    render(<RegistrySearch {...defaultProps} disabled />)
    
    expect(screen.getByPlaceholderText('Search registries...')).toBeDisabled()
  })
})

describe('ModernRegistryCard', () => {
  const mockRegistry: RegistryConnection = {
    id: 'registry-1',
    name: 'Test Registry',
    url: 'https://registry.test.com',
    provider: 'generic',
    authType: 'none',
    createdAt: '2024-01-01T00:00:00Z',
    isDefault: true,
    capabilities: {
      canDelete: true,
      canSearch: true,
      hasRateLimit: false,
      canListCatalog: true,
    },
  }

  const defaultProps = {
    registry: mockRegistry,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSetDefault: vi.fn(),
    onPing: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render registry information', () => {
    render(<ModernRegistryCard {...defaultProps} />)
    
    expect(screen.getByText('Test Registry')).toBeInTheDocument()
    expect(screen.getByText('https://registry.test.com')).toBeInTheDocument()
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('should render capabilities badges', () => {
    render(<ModernRegistryCard {...defaultProps} />)
    
    expect(screen.getByText('generic')).toBeInTheDocument()
    expect(screen.getByText('Can Delete')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('should render status indicator', () => {
    render(<ModernRegistryCard {...defaultProps} status="connected" latencyMs={150} />)
    
    expect(screen.getByText('connected')).toBeInTheDocument()
    expect(screen.getByText('(150ms)')).toBeInTheDocument()
  })

  it('should call onPing when Test button is clicked', () => {
    const mockOnPing = vi.fn()
    render(<ModernRegistryCard {...defaultProps} onPing={mockOnPing} />)
    
    fireEvent.click(screen.getByText('Test'))
    
    expect(mockOnPing).toHaveBeenCalled()
  })

  it('should call onEdit when Edit button is clicked', () => {
    const mockOnEdit = vi.fn()
    render(<ModernRegistryCard {...defaultProps} onEdit={mockOnEdit} />)
    
    fireEvent.click(screen.getByText('Edit'))
    
    expect(mockOnEdit).toHaveBeenCalled()
  })

  it('should call onSetDefault when Set Default button is clicked', () => {
    const mockOnSetDefault = vi.fn()
    render(<ModernRegistryCard {...defaultProps} onSetDefault={mockOnSetDefault} />)
    
    fireEvent.click(screen.getByText('Set Default'))
    
    expect(mockOnSetDefault).toHaveBeenCalled()
  })

  it('should call onDelete when Delete button is clicked', () => {
    const mockOnDelete = vi.fn()
    render(<ModernRegistryCard {...defaultProps} onDelete={mockOnDelete} />)
    
    fireEvent.click(screen.getByText('Delete'))
    
    expect(mockOnDelete).toHaveBeenCalled()
  })

  it('should render rate limit when available', () => {
    const registryWithRateLimit = {
      ...mockRegistry,
      rateLimit: {
        limit: 1000,
        remaining: 300,
      },
    }
    
    render(<ModernRegistryCard {...defaultProps} registry={registryWithRateLimit} />)
    
    expect(screen.getByText('Rate Limit Usage')).toBeInTheDocument()
    expect(screen.getByText('30.0%')).toBeInTheDocument()
  })

  it('should show loading state when isLoading is true', () => {
    render(<ModernRegistryCard {...defaultProps} isLoading={true} />)
    
    const refreshIcon = screen.getByTestId('refresh-icon')
    expect(refreshIcon).toHaveClass('motion-safe:animate-spin')
  })
})

describe('RegistryLoading', () => {
  it('should render skeleton cards', () => {
    render(<RegistryLoading count={3} />)
    
    const skeletons = screen.getAllByRole('button') // Skeleton divs are not semantic
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should render default count when not specified', () => {
    const { container } = render(<RegistryLoading />)
    
    // Should render 4 skeleton cards by default
    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
  })
})

describe('RegistryEmpty', () => {
  it('should render empty state without search', () => {
    render(<RegistryEmpty />)
    
    expect(screen.getByText('No registries connected')).toBeInTheDocument()
    expect(screen.getByText('Connect your first container registry to start managing your Docker images.')).toBeInTheDocument()
    expect(screen.getByText('Add Registry')).toBeInTheDocument()
  })

  it('should render search empty state when search query is provided', () => {
    render(<RegistryEmpty searchQuery="test" />)
    
    expect(screen.getByText('No registries found')).toBeInTheDocument()
    expect(screen.getByText('No registries match "test". Try a different search term.')).toBeInTheDocument()
  })

  it('should call onAddRegistry when Add Registry button is clicked', () => {
    const mockOnAdd = vi.fn()
    render(<RegistryEmpty onAddRegistry={mockOnAdd} />)
    
    fireEvent.click(screen.getByText('Add Registry'))
    
    expect(mockOnAdd).toHaveBeenCalled()
  })
})

describe('RegistryError', () => {
  it('should render error state', () => {
    render(<RegistryError />)
    
    expect(screen.getByText('Failed to load registries')).toBeInTheDocument()
    expect(screen.getByText('Unable to fetch your registries. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('Try Again')).toBeInTheDocument()
  })

  it('should render custom message when provided', () => {
    const customMessage = 'Custom error message'
    render(<RegistryError message={customMessage} />)
    
    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('should call onRetry when Try Again button is clicked', () => {
    const mockOnRetry = vi.fn()
    render(<RegistryError onRetry={mockOnRetry} />)
    
    fireEvent.click(screen.getByText('Try Again'))
    
    expect(mockOnRetry).toHaveBeenCalled()
  })
})
