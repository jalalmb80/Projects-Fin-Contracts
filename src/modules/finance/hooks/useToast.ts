import { useToast } from '../components/ui/Toast';

export function useToastNotification() {
  const { addToast } = useToast();

  return {
    success: (message: string) => addToast('success', message),
    error: (message: string) => addToast('error', message),
    warning: (message: string) => addToast('warning', message),
    info: (message: string) => addToast('info', message),
  };
}
