import React, { createContext, useContext, useState, useCallback } from 'react';
import { Notification, NotificationType } from '../types';

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (
    type: NotificationType,
    title: string,
    message: string,
    duration?: number,
    actions?: Array<{ label: string; onClick: () => void }>
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    type: NotificationType,
    title: string,
    message: string,
    duration: number = 5000,
    actions?: Array<{ label: string; onClick: () => void }>
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      actions,
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove notification after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    removeNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
