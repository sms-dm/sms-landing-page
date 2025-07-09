export function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <div className="flex justify-center animate-pulse">
          <img 
            src="/images/sms-logo.svg" 
            alt="SMS - Smart Maintenance System" 
            className="h-20 w-auto"
          />
        </div>
        <div className="space-y-4">
          <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-sm text-muted-foreground">Loading Smart Maintenance System...</p>
        </div>
      </div>
    </div>
  );
}