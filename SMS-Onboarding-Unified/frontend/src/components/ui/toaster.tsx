import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/hooks/redux';
import { removeToast } from '@/store/slices/uiSlice';
import { cn } from '@/utils/cn';

export function Toaster() {
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

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'min-w-[300px] rounded-md p-4 shadow-lg transition-all',
            {
              'bg-green-50 text-green-900 border border-green-200': toast.type === 'success',
              'bg-red-50 text-red-900 border border-red-200': toast.type === 'error',
              'bg-yellow-50 text-yellow-900 border border-yellow-200': toast.type === 'warning',
              'bg-blue-50 text-blue-900 border border-blue-200': toast.type === 'info',
            }
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium">{toast.title}</p>
              {toast.description && (
                <p className="mt-1 text-sm opacity-90">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dispatch(removeToast(toast.id))}
              className="ml-4 text-current opacity-50 hover:opacity-100"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}