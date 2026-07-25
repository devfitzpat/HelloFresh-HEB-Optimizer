import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  handleReset = () => {
    try {
      localStorage.removeItem('grocery-optimizer');
    } catch {
      // storage unavailable
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-3" aria-hidden="true">
            &#x1F635;&#x200D;&#x1F4AB;
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 mb-6">
            Reloading usually fixes it. If it keeps happening, reset the app — that clears your
            saved plan and starts fresh.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Reload
            </button>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
            >
              Reset app
            </button>
          </div>
        </div>
      </div>
    );
  }
}
