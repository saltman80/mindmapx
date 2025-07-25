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
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: '1rem', textAlign: 'center' }}>
          Oops! Something went wrong loading the mind map. Please try again.
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
