import { store } from '@/store';
import { addToast } from '@/store/slices/uiSlice';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  title: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export const toast = {
  success: (title: string, description?: string) => {
    store.dispatch(addToast({
      id: Date.now().toString(),
      title,
      description,
      type: 'success',
      duration: 5000,
    }));
  },
  
  error: (title: string, description?: string) => {
    store.dispatch(addToast({
      id: Date.now().toString(),
      title,
      description,
      type: 'error',
      duration: 7000,
    }));
  },
  
  warning: (title: string, description?: string) => {
    store.dispatch(addToast({
      id: Date.now().toString(),
      title,
      description,
      type: 'warning',
      duration: 6000,
    }));
  },
  
  info: (title: string, description?: string) => {
    store.dispatch(addToast({
      id: Date.now().toString(),
      title,
      description,
      type: 'info',
      duration: 5000,
    }));
  },
  
  custom: (options: ToastOptions) => {
    store.dispatch(addToast({
      id: Date.now().toString(),
      ...options,
      type: options.type || 'info',
      duration: options.duration || 5000,
    }));
  },
};

