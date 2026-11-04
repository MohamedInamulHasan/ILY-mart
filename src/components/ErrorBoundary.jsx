import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#E8EAEF] dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="w-14 h-14 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                            !
                        </div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Something went wrong
                        </h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
                            An unexpected error occurred while displaying this page.
                        </p>
                        <button
                            onClick={this.handleReload}
                            className="w-full py-3 px-4 bg-[#2E5A2E] hover:bg-[#234523] text-white rounded-xl font-bold text-sm shadow-md transition-transform active:scale-95"
                        >
                            Refresh Page
                        </button>
                        {this.state.error && (
                            <details className="mt-4 text-left text-[11px] text-red-600 overflow-auto max-h-40 bg-red-50 dark:bg-gray-900 p-2 rounded">
                                {this.state.error.toString()}
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
