import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    const { error, errorInfo } = this.state;
    if (errorInfo) {
      // Fallback UI when an error is caught
      return (
        <div className="min-h-screen flex items-start justify-center p-6 bg-red-50">
          <div className="max-w-3xl w-full bg-white border rounded shadow p-6">
            <h2 className="text-xl font-bold text-red-700">An unexpected error occurred</h2>
            <p className="mt-2 text-sm text-gray-700">The app caught a runtime error — details are shown below.</p>
            <div className="mt-4 text-xs text-gray-800 whitespace-pre-wrap bg-gray-100 p-3 rounded">
              <strong>{error && error.toString()}</strong>
              {errorInfo && errorInfo.componentStack && (
                <pre className="mt-2 text-xs">{errorInfo.componentStack}</pre>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => window.location.reload()} className="px-3 py-1 bg-blue-600 text-white rounded">Reload</button>
              <button onClick={() => {
                // Copy error to clipboard for easy sharing
                try { navigator.clipboard.writeText(`${error}\n\n${errorInfo?.componentStack || ''}`); alert('Error copied to clipboard'); }
                catch (e) { alert('Copy failed'); }
              }} className="px-3 py-1 bg-gray-200 rounded">Copy details</button>
            </div>
          </div>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;
