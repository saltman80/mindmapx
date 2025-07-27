import React, { Component, ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('Caught in ErrorBoundary:', error)
    this.setState({ hasError: true })
  }

  reset() {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    const popup = this.state.hasError ? (
      <div
        role="alert"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          padding: '1rem',
          background: 'white',
          border: '1px solid red',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        Oops! Something went wrong loading the mind map. Please try again.
        <button onClick={this.reset} style={{ marginLeft: '0.5rem' }}>
          Dismiss
        </button>
      </div>
    ) : null

    return (
      <>
        {this.props.children}
        {popup}
      </>
    )
  }
}

export default ErrorBoundary
