import { render, screen } from '@testing-library/react'
import {
  EmptyState,
  NoConversationsEmpty,
  NoDocumentsEmpty,
  NoSearchResultsEmpty,
  ErrorEmpty,
  MiniEmptyState
} from '../empty-states'

describe('EmptyState', () => {
  it('renders with title and description', () => {
    render(
      <EmptyState
        title="Test Title"
        description="Test Description"
      />
    )
    
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })

  it('renders with action button', () => {
    const handleAction = jest.fn()
    
    render(
      <EmptyState
        title="Test"
        description="Test"
        action={{
          label: 'Click Me',
          onClick: handleAction
        }}
      />
    )
    
    const button = screen.getByText('Click Me')
    expect(button).toBeInTheDocument()
    
    button.click()
    expect(handleAction).toHaveBeenCalledTimes(1)
  })

  it('renders with secondary action', () => {
    const handlePrimary = jest.fn()
    const handleSecondary = jest.fn()
    
    render(
      <EmptyState
        title="Test"
        description="Test"
        action={{
          label: 'Primary',
          onClick: handlePrimary
        }}
        secondaryAction={{
          label: 'Secondary',
          onClick: handleSecondary
        }}
      />
    )
    
    expect(screen.getByText('Primary')).toBeInTheDocument()
    expect(screen.getByText('Secondary')).toBeInTheDocument()
  })

  it('renders custom children', () => {
    render(
      <EmptyState
        title="Test"
        description="Test"
      >
        <div>Custom Content</div>
      </EmptyState>
    )
    
    expect(screen.getByText('Custom Content')).toBeInTheDocument()
  })
})

describe('NoConversationsEmpty', () => {
  it('renders with correct text and CTA', () => {
    const handleCreate = jest.fn()
    
    render(<NoConversationsEmpty onCreateConversation={handleCreate} />)
    
    expect(screen.getByText('No Conversations Yet')).toBeInTheDocument()
    expect(screen.getByText(/Start a conversation with an AI tutor/)).toBeInTheDocument()
    
    const button = screen.getByText('Start Chatting')
    button.click()
    expect(handleCreate).toHaveBeenCalledTimes(1)
  })
})

describe('NoDocumentsEmpty', () => {
  it('renders with upload CTA', () => {
    const handleUpload = jest.fn()
    
    render(<NoDocumentsEmpty onUpload={handleUpload} />)
    
    expect(screen.getByText('No Documents Uploaded')).toBeInTheDocument()
    expect(screen.getByText(/Upload PDF, TXT, or MD files/)).toBeInTheDocument()
    
    const button = screen.getByText('Upload Document')
    button.click()
    expect(handleUpload).toHaveBeenCalledTimes(1)
  })
})

describe('NoSearchResultsEmpty', () => {
  it('renders with query in message', () => {
    render(<NoSearchResultsEmpty query="test query" />)
    
    expect(screen.getByText(/No results found for "test query"/)).toBeInTheDocument()
  })

  it('renders with clear button when onClear provided', () => {
    const handleClear = jest.fn()
    
    render(<NoSearchResultsEmpty query="test" onClear={handleClear} />)
    
    const button = screen.getByText('Clear Search')
    button.click()
    expect(handleClear).toHaveBeenCalledTimes(1)
  })

  it('renders without query', () => {
    render(<NoSearchResultsEmpty />)
    
    expect(screen.getByText(/Your search didn't match any items/)).toBeInTheDocument()
  })
})

describe('ErrorEmpty', () => {
  it('renders with default message', () => {
    render(<ErrorEmpty />)
    
    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument()
  })

  it('renders with custom title and description', () => {
    render(
      <ErrorEmpty
        title="Custom Error"
        description="Custom error description"
      />
    )
    
    expect(screen.getByText('Custom Error')).toBeInTheDocument()
    expect(screen.getByText('Custom error description')).toBeInTheDocument()
  })

  it('renders retry button', () => {
    const handleRetry = jest.fn()
    
    render(<ErrorEmpty onRetry={handleRetry} />)
    
    const button = screen.getByText('Try Again')
    button.click()
    expect(handleRetry).toHaveBeenCalledTimes(1)
  })
})

describe('MiniEmptyState', () => {
  it('renders compact version', () => {
    render(<MiniEmptyState message="No items found" />)
    
    expect(screen.getByText('No items found')).toBeInTheDocument()
  })

  it('renders with action', () => {
    const handleAction = jest.fn()
    
    render(
      <MiniEmptyState
        message="No items"
        action={{
          label: 'Add Item',
          onClick: handleAction
        }}
      />
    )
    
    const button = screen.getByText('Add Item')
    button.click()
    expect(handleAction).toHaveBeenCalledTimes(1)
  })
})
