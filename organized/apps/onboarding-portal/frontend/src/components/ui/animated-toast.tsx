import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { removeToast } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export function AnimatedToaster() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timers = toasts.map((toast) => {
      return setTimeout(() => {
        dispatch(removeToast(toast.id));
      }, toast.duration || 5000);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600 animate-bounceIn" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          className={cn(
            'min-w-[350px] max-w-md pointer-events-auto',
            'transform transition-all duration-300 ease-out',
            'animate-slideIn'
          )}
          style={{
            animationDelay: `${index * 50}ms`,
          }}
        >
          <div
            className={cn(
              'rounded-lg shadow-lg border backdrop-blur-sm',
              'transition-all duration-200 hover:shadow-xl',
              {
                'bg-green-50/95 text-green-900 border-green-200': toast.type === 'success',
                'bg-red-50/95 text-red-900 border-red-200': toast.type === 'error',
                'bg-yellow-50/95 text-yellow-900 border-yellow-200': toast.type === 'warning',
                'bg-blue-50/95 text-blue-900 border-blue-200': toast.type === 'info',
              }
            )}
          >
            <div className="flex items-start gap-3 p-4">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(toast.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description && (
                  <p className="mt-1 text-sm opacity-90">{toast.description}</p>
                )}
              </div>
              <button
                onClick={() => dispatch(removeToast(toast.id))}
                className={cn(
                  'flex-shrink-0 ml-2 p-1 rounded-md',
                  'transition-all duration-200',
                  'hover:bg-black/5 focus:outline-none focus:ring-2',
                  {
                    'focus:ring-green-500': toast.type === 'success',
                    'focus:ring-red-500': toast.type === 'error',
                    'focus:ring-yellow-500': toast.type === 'warning',
                    'focus:ring-blue-500': toast.type === 'info',
                  }
                )}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {toast.type === 'success' && (
              <div className="h-1 bg-green-200 rounded-b-lg overflow-hidden">
                <div
                  className="h-full bg-green-500 animate-[slideIn_0.3s_ease-out]"
                  style={{
                    animation: `progress ${toast.duration || 5000}ms linear`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Add the progress animation to globals.css
const progressKeyframe = `
@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`;