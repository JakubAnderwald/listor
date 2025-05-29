import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useOfflineDetection';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const OfflineNotification = () => {
  const { isOffline, wasOffline, isOnline } = useNetworkStatus();

  if (isOffline) {
    return (
      <Alert className="fixed top-4 left-4 right-4 z-50 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
        <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="text-amber-800 dark:text-amber-200">
          You're currently offline. Some features may not be available.
        </AlertDescription>
      </Alert>
    );
  }

  if (wasOffline && isOnline) {
    return (
      <Alert className="fixed top-4 left-4 right-4 z-50 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 animate-in slide-in-from-top duration-300">
        <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          You're back online! Your changes will sync automatically.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};