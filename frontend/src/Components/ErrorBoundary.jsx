import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Spools Error Boundary caught an error:", error, errorInfo);

    // Auto-reload on stale PWA chunks after deployment
    const isChunkLoadFailed =
      error?.message?.includes("Failed to fetch dynamically imported module") ||
      error?.message?.includes("Importing a module script failed");

    if (isChunkLoadFailed) {
      const hasRetried = sessionStorage.getItem("spools_chunk_retry");
      if (!hasRetried) {
        sessionStorage.setItem("spools_chunk_retry", "true");
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.removeItem("user-spools");
      sessionStorage.clear();
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
    window.location.href = "/auth";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-zinc-50 dark:bg-ebony text-zinc-900 dark:text-zinc-100 font-sans transition-colors">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <img
                src="/dark-mode.svg"
                alt="Spools Logo"
                className="w-14 h-14 object-contain dark:hidden"
              />
              <img
                src="/light-mode.svg"
                alt="Spools Logo"
                className="w-14 h-14 object-contain hidden dark:block"
              />
            </div>
            <h1 className="text-xl font-bold mb-2">Something went wrong</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Spools ran into an unexpected issue while rendering. You can
              refresh the page or reset your local session.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold text-sm hover:opacity-90 active:scale-95 transition-all shadow-sm"
              >
                Reload Spools
              </button>
              <button
                onClick={this.handleResetSession}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all"
              >
                Reset & Log In
              </button>
            </div>

            {process.env.NODE_ENV !== "production" && this.state.error && (
              <details className="mt-6 text-left text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-3 rounded-xl overflow-x-auto border border-red-200 dark:border-red-900/40">
                <summary className="font-semibold cursor-pointer mb-1">
                  Technical Details
                </summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.error?.toString()}
                </pre>
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
