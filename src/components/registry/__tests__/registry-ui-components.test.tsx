import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  ModernRegistryCard,
  RegistryLoading,
  RegistryEmpty,
  RegistryError,
} from '@/components/registry/registry-ui-components'
import type { RegistryConnection } from '@/types/registry'

// Mock lucide-react — inline all icons so there are no hoisting issues
vi.mock('lucide-react', () => ({
  PlusIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="plus-icon" className={className as string} {...props} />,
  AlertTriangleIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="alert-icon" className={className as string} {...props} />,
  AlertCircleIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="alert-circle-icon" className={className as string} {...props} />,
  RefreshCwIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="refresh-icon" className={className as string} {...props} />,
  ServerIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="server-icon" className={className as string} {...props} />,
  BoxIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="box-icon" className={className as string} {...props} />,
  MoreHorizontalIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="more-icon" className={className as string} {...props} />,
  PencilIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="pencil-icon" className={className as string} {...props} />,
  StarIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="star-icon" className={className as string} {...props} />,
  Trash2Icon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="trash-icon" className={className as string} {...props} />,
  ExternalLinkIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="external-link-icon" className={className as string} {...props} />,
  ArrowRightIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="arrow-right-icon" className={className as string} {...props} />,
  CheckCircle2Icon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="check-icon" className={className as string} {...props} />,
  XCircleIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="x-circle-icon" className={className as string} {...props} />,
  LoaderIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="loader-icon" className={className as string} {...props} />,
  LockOpenIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="lock-open-icon" className={className as string} {...props} />,
  LockIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="lock-icon" className={className as string} {...props} />,
  KeyRoundIcon: ({ className, ...props }: Record<string, unknown>) => <div data-testid="key-round-icon" className={className as string} {...props} />,
}))

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

  it('should render registry name, url, and default badge', () => {
    render(<ModernRegistryCard {...defaultProps} />)

    expect(screen.getByText('Test Registry')).toBeInTheDocument()
    expect(screen.getByText('https://registry.test.com')).toBeInTheDocument()
    expect(screen.getByText('Default')).toBeInTheDocument()
  })

  it('should render auth type label', () => {
    render(<ModernRegistryCard {...defaultProps} />)

    // authType 'none' renders "Anonymous" label
    expect(screen.getByText('Anonymous')).toBeInTheDocument()
  })

  it('should render connected status with latency', () => {
    render(<ModernRegistryCard {...defaultProps} status="connected" latencyMs={150} />)

    expect(screen.getByText('Connected')).toBeInTheDocument()
    expect(screen.getByText(/150ms/)).toBeInTheDocument()
  })

  it('should render rate limit bar when rate limit data is present', () => {
    const registryWithRateLimit = {
      ...mockRegistry,
      rateLimit: { limit: 1000, remaining: 300 },
    }

    render(<ModernRegistryCard {...defaultProps} registry={registryWithRateLimit} />)

    expect(screen.getByText('API quota remaining')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('should render browse repositories link', () => {
    render(<ModernRegistryCard {...defaultProps} />)

    expect(screen.getByText('Browse repositories')).toBeInTheDocument()
  })
})

describe('RegistryLoading', () => {
  it('should render the specified number of skeleton cards', () => {
    const { container } = render(<RegistryLoading count={3} />)

    const grid = container.querySelector('.grid')
    expect(grid?.children).toHaveLength(3)
  })

  it('should default to 4 skeleton cards', () => {
    const { container } = render(<RegistryLoading />)

    const grid = container.querySelector('.grid')
    expect(grid?.children).toHaveLength(4)
  })
})

describe('RegistryEmpty', () => {
  it('should render empty state', () => {
    render(<RegistryEmpty />)

    expect(screen.getByText('No registries yet')).toBeInTheDocument()
    expect(screen.getByText('Add your first registry')).toBeInTheDocument()
  })

  it('should call onAddRegistry when button is clicked', () => {
    const mockOnAdd = vi.fn()
    render(<RegistryEmpty onAddRegistry={mockOnAdd} />)

    fireEvent.click(screen.getByText('Add your first registry'))

    expect(mockOnAdd).toHaveBeenCalled()
  })
})

describe('RegistryError', () => {
  it('should render error state', () => {
    render(<RegistryError />)

    expect(screen.getByText('Failed to load registries')).toBeInTheDocument()
    expect(screen.getByText('Unable to fetch your registries. Please try again.')).toBeInTheDocument()
    expect(screen.getByText('Try again')).toBeInTheDocument()
  })

  it('should render custom message when provided', () => {
    const customMessage = 'Custom error message'
    render(<RegistryError message={customMessage} />)

    expect(screen.getByText(customMessage)).toBeInTheDocument()
  })

  it('should call onRetry when Try again is clicked', () => {
    const mockOnRetry = vi.fn()
    render(<RegistryError onRetry={mockOnRetry} />)

    fireEvent.click(screen.getByText('Try again'))

    expect(mockOnRetry).toHaveBeenCalled()
  })
})
