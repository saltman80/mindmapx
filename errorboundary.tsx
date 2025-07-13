const { error } = this.state
      const { fallback, fallbackRender } = this.props

      if (fallbackRender) {
        return <>{fallbackRender({ error, reset: this.reset })}</>
      }

      if (fallback && React.isValidElement(fallback)) {
        return <>{fallback}</>
      }

      return (
        <div role="alert" style={{ padding: '1rem', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <pre style={{ color: 'red' }}>{error.message}</pre>
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