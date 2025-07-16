import { FallbackProps } from 'react-error-boundary';

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
        <h2 className="mb-4 text-2xl font-bold text-destructive">Something went wrong</h2>
        <div className="mb-4 rounded bg-muted p-3">
          <p className="font-mono text-sm text-muted-foreground">{error.message}</p>
        </div>
        <button
          onClick={resetErrorBoundary}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}