import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary, #0f0f1a)',
            color: 'var(--text-primary, #e2e8f0)',
            textAlign: 'center',
            padding: '2rem',
            gap: '1.5rem',
          }}
        >
          <div style={{ fontSize: '4rem' }}>⚠️</div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ color: 'var(--text-secondary, #94a3b8)', maxWidth: '500px' }}>
            An unexpected error occurred. Please reload the page to try again.
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre
              style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '1rem',
                borderRadius: '0.75rem',
                maxWidth: '600px',
                overflow: 'auto',
                fontSize: '0.8rem',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '0.75rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 600,
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
