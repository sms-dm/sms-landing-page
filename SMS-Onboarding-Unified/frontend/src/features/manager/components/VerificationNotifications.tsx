import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { verificationService, VerificationNotification } from '@/services/verification';
import { toast } from '@/utils/toast';
import { format } from 'date-fns';

export const VerificationNotifications: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<VerificationNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await verificationService.getNotifications(true);
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeNotification = async (notification: VerificationNotification) => {
    try {
      await verificationService.acknowledgeNotification(notification.id);
      
      // Remove from list
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: 'Notification acknowledged',
        description: 'The notification has been marked as read',
      });
    } catch (error) {
      console.error('Error acknowledging notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to acknowledge notification',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CRITICAL_OVERDUE':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'OVERDUE':
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'CRITICAL_OVERDUE':
        return 'bg-red-50 border-red-200';
      case 'OVERDUE':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getNotificationTitle = (notification: VerificationNotification) => {
    switch (notification.notificationType) {
      case 'CRITICAL_OVERDUE':
        return 'Critical: Verification Overdue';
      case 'OVERDUE':
        return 'Verification Overdue';
      default:
        return 'Verification Due Soon';
    }
  };

  const getNotificationMessage = (notification: VerificationNotification) => {
    const equipment = notification.equipment;
    const days = notification.daysUntilDue || 0;
    
    if (days < 0) {
      return `${equipment.name} is ${Math.abs(days)} days overdue for verification`;
    } else if (days === 0) {
      return `${equipment.name} is due for verification today`;
    } else {
      return `${equipment.name} is due for verification in ${days} days`;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl z-50 max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">Verification Notifications</h3>
              <p className="text-sm text-gray-600">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600">All caught up!</p>
                  <p className="text-sm text-gray-500 mt-1">
                    No pending verification notifications
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${getNotificationColor(
                        notification.notificationType
                      )}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.notificationType)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {getNotificationTitle(notification)}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {getNotificationMessage(notification)}
                          </p>
                          <div className="mt-2 text-xs text-gray-500">
                            <p>{notification.equipment.vessel.name}</p>
                            <p>
                              Due: {format(new Date(notification.equipment.nextVerificationDate), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeNotification(notification)}
                            className="mt-3"
                          >
                            Acknowledge
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to verification dashboard
                    window.location.href = '/dashboard/verifications';
                  }}
                  className="w-full"
                >
                  View All Verifications
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};