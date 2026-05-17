"use client";

import React from "react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error | null;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console and (optionally) send to analytics
    // Keep this minimal to avoid adding new telemetry deps
    // eslint-disable-next-line no-console
    console.error("ErrorBoundary caught error:", { error, info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 text-center">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-sm text-gray-600">An unexpected error occurred. Try refreshing the page.</p>
          <pre className="mt-4 text-left text-xs text-red-700 max-w-3xl mx-auto overflow-auto">{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}
