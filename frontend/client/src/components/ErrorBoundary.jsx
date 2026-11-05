import React from 'react'

/**
 * SEEMEE Atelier - Luxury Root Error Boundary
 * Catches rendering exceptions anywhere in the component tree,
 * logs the incident, and displays an elegant luxury recovery interface
 * instead of unmounting the DOM or showing an unrecoverable white screen.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
    console.error('CRITICAL: React ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAF7F2',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
          color: '#2B2B2B'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E8DCC4',
            borderRadius: '16px',
            padding: '48px 36px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{
              fontSize: '0.85rem',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              color: '#B8941E',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              SEEMEE Atelier
            </div>

            <h1 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '2.2rem',
              fontWeight: 600,
              lineHeight: 1.2,
              marginBottom: '16px',
              color: '#1C1917'
            }}>
              Something went unexpectedly wrong
            </h1>

            <p style={{
              color: '#666',
              fontSize: '0.98rem',
              lineHeight: 1.6,
              marginBottom: '32px'
            }}>
              An unexpected error occurred while loading this view. Your account and cart data are safe. Please try refreshing the page or returning home.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={this.handleReload}
                style={{
                  backgroundColor: '#1C1917',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '12px 28px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#D4AF37'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1C1917'}
              >
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: 'transparent',
                  color: '#1C1917',
                  border: '1px solid #D1D5DB',
                  borderRadius: '30px',
                  padding: '12px 28px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  letterSpacing: '0.5px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#1C1917'
                  e.currentTarget.style.backgroundColor = '#FAF7F2'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#D1D5DB'
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Go to Homepage
              </button>
            </div>

            {import.meta.env?.DEV && this.state.error && (
              <details style={{
                marginTop: '32px',
                textAlign: 'left',
                backgroundColor: '#FFF1F2',
                border: '1px solid #FECDD3',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.82rem',
                color: '#9F1239'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                  Developer Diagnostics (Dev Mode Only)
                </summary>
                <pre style={{
                  marginTop: '8px',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  fontFamily: 'monospace'
                }}>
                  {this.state.error.toString()}
                  {'\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

