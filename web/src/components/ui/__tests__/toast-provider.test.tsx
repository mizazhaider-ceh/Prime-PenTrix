import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { ToastProvider, useToast } from '../toast-provider'

// Test component to trigger toasts
function TestComponent() {
  const toast = useToast()
  
  return (
    <div>
      <button onClick={() => toast.success('Success', 'Success message')}>
        Success Toast
      </button>
      <button onClick={() => toast.error('Error', 'Error message')}>
        Error Toast
      </button>
      <button onClick={() => toast.info('Info', 'Info message')}>
        Info Toast
      </button>
      <button onClick={() => toast.warning('Warning', 'Warning message')}>
        Warning Toast
      </button>
    </div>
  )
}

describe('ToastProvider', () => {
  it('renders without crashing', () => {
    render(
      <ToastProvider>
        <div>Test</div>
      </ToastProvider>
    )
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('shows success toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Success Toast')
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Success message')).toBeInTheDocument()
    })
  })

  it('shows error toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Error Toast')
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Error message')).toBeInTheDocument()
    })
  })

  it('shows info toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Info Toast')
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByText('Info')).toBeInTheDocument()
      expect(screen.getByText('Info message')).toBeInTheDocument()
    })
  })

  it('shows warning toast', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Warning Toast')
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByText('Warning')).toBeInTheDocument()
      expect(screen.getByText('Warning message')).toBeInTheDocument()
    })
  })

  it('allows closing toasts', async () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    )

    const button = screen.getByText('Success Toast')
    act(() => {
      button.click()
    })

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })

    const closeButton = screen.getByRole('button', { name: '' })
    act(() => {
      closeButton.click()
    })

    await waitFor(() => {
      expect(screen.queryByText('Success')).not.toBeInTheDocument()
    })
  })

  it('throws error when useToast is used outside provider', () => {
    const TestBadComponent = () => {
      useToast()
      return null
    }

    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    expect(() => {
      render(<TestBadComponent />)
    }).toThrow('useToast must be used within ToastProvider')

    consoleSpy.mockRestore()
  })
})
