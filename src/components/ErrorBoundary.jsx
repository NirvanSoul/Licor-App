import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    padding: '2rem',
                    textAlign: 'center',
                    color: '#ef4444',
                    background: '#fef2f2',
                    borderRadius: '12px',
                    margin: '1rem'
                }}>
                    <AlertTriangle size={48} style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                        Algo salió mal en esta sección
                    </h2>
                    <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem', maxWidth: '400px', opacity: 0.8 }}>
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        <RefreshCw size={16} />
                        Recargar Página
                    </button>
                    {this.state.errorInfo && (
                        <details style={{ marginTop: '2rem', textAlign: 'left', width: '100%', overflow: 'auto', background: 'white', padding: '1rem', borderRadius: '8px', fontSize: '0.75rem', color: '#333' }}>
                            <summary style={{ cursor: 'pointer', marginBottom: '0.5rem', fontWeight: 600 }}>Ver detalles técnicos</summary>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>
                                {this.state.errorInfo.componentStack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
