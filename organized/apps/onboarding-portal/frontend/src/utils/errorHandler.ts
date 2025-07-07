import { toast } from './toast';

export interface ApiError {
  status?: number;
  data?: {
    message?: string;
    errors?: any[];
  };
  message?: string;
}

export const handleApiError = (error: ApiError) => {
  let errorMessage = 'An unexpected error occurred';
  let errorTitle = 'Error';

  if (error.status === 401) {
    errorTitle = 'Authentication Error';
    errorMessage = 'Please log in again';
  } else if (error.status === 403) {
    errorTitle = 'Permission Denied';
    errorMessage = 'You do not have permission to perform this action';
  } else if (error.status === 404) {
    errorTitle = 'Not Found';
    errorMessage = 'The requested resource was not found';
  } else if (error.status === 422 || error.status === 400) {
    errorTitle = 'Validation Error';
    errorMessage = error.data?.message || 'Please check your input and try again';
  } else if (error.status === 500) {
    errorTitle = 'Server Error';
    errorMessage = 'Something went wrong on our end. Please try again later';
  } else if (error.data?.message) {
    errorMessage = error.data.message;
  } else if (error.message) {
    errorMessage = error.message;
  }

  toast({
    title: errorTitle,
    description: errorMessage,
    variant: 'destructive',
  });

  return { errorTitle, errorMessage };
};

export const isNetworkError = (error: any): boolean => {
  return !error.status && error.message === 'Network Error';
};

export const handleNetworkError = () => {
  toast({
    title: 'Network Error',
    description: 'Please check your internet connection and try again',
    variant: 'destructive',
  });
};