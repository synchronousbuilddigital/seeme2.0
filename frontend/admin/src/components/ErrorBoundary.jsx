import React from 'react'

/**
 * SEEMEE Atelier - Admin Error Boundary
 * Catches rendering exceptions in the admin portal,
 * logs the incident, and displays a recovery interface
 * instead of unmounting the DOM or showing a blank white screen.
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
    console.error('CRITICAL: Admin ErrorBoundary caught an unhandled error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
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
          backgroundColor: '#0F172A',
          padding: '24px',
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#F8FAFC'
        }}>
          <div style={{
            maxWidth: '560px',
            width: '100%',
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '40px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <div style={{
              fontSize: '0.85rem',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#38BDF8',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              SEEMEE Admin Console
            </div>

            <h1 style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              lineHeight: 1.3,
              marginBottom: '16px',
              color: '#FFFFFF'
            }}>
              Admin Portal Encountered an Error
            </h1>

            <p style={{
              color: '#94A3B8',
              fontSize: '0.95rem',
              lineHeight: 1.6,
              marginBottom: '28px'
            }}>
              A rendering exception occurred in this panel. Please reload the console or return to dashboard.
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
                  backgroundColor: '#38BDF8',
                  color: '#0F172A',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Reload Console
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  backgroundColor: 'transparent',
                  color: '#F8FAFC',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Return to Dashboard
              </button>
            </div>

            {this.state.error && (
              <details style={{
                marginTop: '28px',
                textAlign: 'left',
                backgroundColor: '#0F172A',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.82rem',
                color: '#F87171'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, outline: 'none' }}>
                  Diagnostics Trace
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

