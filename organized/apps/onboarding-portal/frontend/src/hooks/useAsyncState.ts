import { useState, useCallback, useRef, useEffect } from 'react';
import { useAppDispatch } from './redux';
import { addToast } from '@/store/slices/uiSlice';

interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isIdle: boolean;
}

interface UseAsyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
  showToast?: boolean;
  retryCount?: number;
  retryDelay?: number;
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions = {}
) {
  const dispatch = useAppDispatch();
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    isIdle: true,
  });

  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]) => {
      if (!mountedRef.current) return;

      setState({
        data: null,
        error: null,
        isLoading: true,
        isSuccess: false,
        isError: false,
        isIdle: false,
      });

      try {
        const data = await asyncFunction(...args);
        
        if (!mountedRef.current) return;

        setState({
          data,
          error: null,
          isLoading: false,
          isSuccess: true,
          isError: false,
          isIdle: false,
        });

        options.onSuccess?.(data);
        
        if (options.showToast && options.successMessage) {
          dispatch(addToast({
            title: 'Success',
            description: options.successMessage,
            type: 'success',
          }));
        }

        retryCountRef.current = 0;
        return data;
      } catch (error) {
        if (!mountedRef.current) return;

        const err = error as Error;
        
        // Retry logic
        if (options.retryCount && retryCountRef.current < options.retryCount) {
          retryCountRef.current++;
          
          setTimeout(() => {
            execute(...args);
          }, options.retryDelay || 1000 * retryCountRef.current);
          
          return;
        }

        setState({
          data: null,
          error: err,
          isLoading: false,
          isSuccess: false,
          isError: true,
          isIdle: false,
        });

        options.onError?.(err);
        
        if (options.showToast) {
          dispatch(addToast({
            title: 'Error',
            description: options.errorMessage || err.message,
            type: 'error',
          }));
        }

        throw error;
      }
    },
    [asyncFunction, dispatch, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
      isIdle: true,
    });
    retryCountRef.current = 0;
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Hook for managing multiple async operations
export function useAsyncQueue() {
  const [queue, setQueue] = useState<Array<{ id: string; status: 'pending' | 'loading' | 'success' | 'error' }>>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const addToQueue = useCallback((id: string) => {
    setQueue(prev => [...prev, { id, status: 'pending' }]);
  }, []);

  const updateQueueItem = useCallback((id: string, status: 'pending' | 'loading' | 'success' | 'error') => {
    setQueue(prev => prev.map(item => item.id === id ? { ...item, status } : item));
  }, []);

  const processQueue = useCallback(async (
    items: any[],
    processor: (item: any) => Promise<void>
  ) => {
    setIsProcessing(true);
    
    for (const item of items) {
      updateQueueItem(item.id, 'loading');
      
      try {
        await processor(item);
        updateQueueItem(item.id, 'success');
      } catch (error) {
        updateQueueItem(item.id, 'error');
      }
    }
    
    setIsProcessing(false);
  }, [updateQueueItem]);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    queue,
    isProcessing,
    addToQueue,
    processQueue,
    clearQueue,
  };
}

// Hook for debounced async operations
export function useDebouncedAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  delay: number = 500,
  options: UseAsyncOptions = {}
) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const async = useAsync(asyncFunction, options);

  const debouncedExecute = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return new Promise<T>((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          try {
            const result = await async.execute(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    },
    [async, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...async,
    execute: debouncedExecute,
  };
}

// Hook for polling async operations
export function usePollingAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  interval: number = 5000,
  options: UseAsyncOptions & { enabled?: boolean } = {}
) {
  const async = useAsync(asyncFunction, options);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (options.enabled !== false) {
      // Initial fetch
      async.execute();

      // Set up polling
      intervalRef.current = setInterval(() => {
        async.execute();
      }, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [options.enabled, interval]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const start = useCallback(() => {
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        async.execute();
      }, interval);
    }
  }, [async, interval]);

  return {
    ...async,
    stop,
    start,
  };
}