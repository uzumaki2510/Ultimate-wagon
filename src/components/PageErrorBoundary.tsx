import { Component, ReactNode } from 'react';
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" className="mx-auto max-w-lg space-y-4 rounded-xl border p-6"><h1 className="text-xl font-semibold">This page could not be displayed</h1><p>Your saved records are unchanged. Reload to get the latest application, or use the menu to open another section.</p><button className="min-h-11 rounded-md bg-primary px-4 text-primary-foreground" onClick={() => window.location.reload()}>Reload page</button></section>;
  }
}
