import { store } from '@/store';
import { addToast } from '@/store/slices/uiSlice';

interface ToastOptions {
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

export const toast = (options: ToastOptions) => {
  const { title, description, variant = 'default', duration } = options;
  
  let type: 'info' | 'error' | 'success' | 'warning' = 'info';
  
  switch (variant) {
    case 'destructive':
      type = 'error';
      break;
    case 'success':
      type = 'success';
      break;
    default:
      type = 'info';
  }
  
  store.dispatch(
    addToast({
      title,
      description,
      type,
      duration,
    })
  );
};