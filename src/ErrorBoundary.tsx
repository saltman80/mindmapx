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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo)
  }

  reset() {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: '1rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          {this.state.error && (
            <pre style={{ color: 'red' }}>{this.state.error.message}</pre>
          )}
          <button onClick={this.reset} style={{ marginTop: '1rem' }}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
