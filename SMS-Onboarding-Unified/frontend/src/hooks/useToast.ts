// Simple toast implementation without external dependency
const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' | 'loading') => {
  console.log(`[${type.toUpperCase()}]: ${message}`);
  // In production, this would show actual toast notifications
};

export const useToast = () => {
  return {
    toast: {
      success: (message: string) => showToast(message, 'success'),
      error: (message: string) => showToast(message, 'error'),
      info: (message: string) => showToast(message, 'info'),
      warning: (message: string) => showToast(message, 'warning'),
      loading: (message: string) => showToast(message, 'loading'),
      dismiss: (id?: string | number) => console.log('Toast dismissed', id),
    }
  };
};

// Export toast object for compatibility
export const toast = {
  success: (message: string) => showToast(message, 'success'),
  error: (message: string) => showToast(message, 'error'),
  info: (message: string) => showToast(message, 'info'),
  warning: (message: string) => showToast(message, 'warning'),
  loading: (message: string) => showToast(message, 'loading'),
  dismiss: (id?: string | number) => console.log('Toast dismissed', id),
};