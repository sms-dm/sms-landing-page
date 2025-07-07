import toast, { Toaster as HotToaster, ToastOptions } from 'react-hot-toast';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';

// Custom toast styles to match SMS theme
const toastStyles: ToastOptions = {
  duration: 4000,
  style: {
    background: '#1f2937',
    color: '#fff',
    border: '1px solid #374151',
    borderRadius: '0.5rem',
    padding: '16px',
    maxWidth: '500px',
  },
};

// Success toast
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...toastStyles,
    ...options,
    icon: <FiCheckCircle className="w-5 h-5 text-status-good" />,
    style: {
      ...toastStyles.style,
      border: '1px solid #10b981',
    },
  });
};

// Error toast
export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...toastStyles,
    ...options,
    icon: <FiXCircle className="w-5 h-5 text-status-critical" />,
    style: {
      ...toastStyles.style,
      border: '1px solid #ef4444',
    },
  });
};

// Warning toast
export const showWarning = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...toastStyles,
    ...options,
    icon: <FiAlertCircle className="w-5 h-5 text-status-warning" />,
    style: {
      ...toastStyles.style,
      border: '1px solid #f59e0b',
    },
  });
};

// Info toast
export const showInfo = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...toastStyles,
    ...options,
    icon: <FiInfo className="w-5 h-5 text-status-info" />,
    style: {
      ...toastStyles.style,
      border: '1px solid #3b82f6',
    },
  });
};

// Loading toast that returns a promise
export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: toastStyles.style,
  });
};

// Promise-based toast for async operations
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      ...toastStyles,
      ...options,
      success: {
        ...toastStyles,
        ...options,
        icon: <FiCheckCircle className="w-5 h-5 text-status-good" />,
        style: {
          ...toastStyles.style,
          border: '1px solid #10b981',
        },
      },
      error: {
        ...toastStyles,
        ...options,
        icon: <FiXCircle className="w-5 h-5 text-status-critical" />,
        style: {
          ...toastStyles.style,
          border: '1px solid #ef4444',
        },
      },
    }
  );
};

// Custom Toaster component with SMS theme
export const SMSToaster = () => {
  return (
    <HotToaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      toastOptions={{
        style: toastStyles.style,
        className: '',
      }}
    />
  );
};

// Export the default toast for custom usage
export { toast };