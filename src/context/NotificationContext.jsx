import React, { createContext, useState, useContext, useEffect } from 'react';
import { useCases } from './CaseContext.jsx';

// Create the context
const NotificationContext = createContext();

// Create a custom hook to use the context
export const useNotifications = () => useContext(NotificationContext);

// Provider component
export const NotificationProvider = ({ children }) => {
  const { cases, allCases } = useCases();
  const [notifications, setNotifications] = useState([]);
  const [, setLastChecked] = useState(Date.now());
  const [processedCaseIds, setProcessedCaseIds] = useState(new Set());
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(new Set());
  
  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('caseNotifications');
    if (savedNotifications) {
      try {
        // Parse the notifications and convert string timestamps back to Date objects
        const parsedNotifications = JSON.parse(savedNotifications);
        
        // Convert timestamp strings to Date objects
        parsedNotifications.forEach(notification => {
          notification.timestamp = new Date(notification.timestamp);
        });
        
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('Error parsing saved notifications:', error);
        setNotifications([]);
      }
    }
    
    // Get the last checked time
    const savedLastChecked = localStorage.getItem('lastNotificationCheck');
    if (savedLastChecked) {
      setLastChecked(parseInt(savedLastChecked, 10));
    }
    
    // Load processed case IDs from localStorage
    const savedProcessedCaseIds = localStorage.getItem('processedCaseIds');
    if (savedProcessedCaseIds) {
      try {
        setProcessedCaseIds(new Set(JSON.parse(savedProcessedCaseIds)));
      } catch (error) {
        console.error('Error parsing processed case IDs:', error);
        setProcessedCaseIds(new Set());
      }
    }

    // Load dismissed notification IDs
    const savedDismissedIds = localStorage.getItem('dismissedNotificationIds');
    if (savedDismissedIds) {
      try {
        setDismissedNotificationIds(new Set(JSON.parse(savedDismissedIds)));
      } catch (error) {
        console.error('Error parsing dismissed notification IDs:', error);
        setDismissedNotificationIds(new Set());
      }
    }
  }, []);
  
  // Save processed case IDs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('processedCaseIds', JSON.stringify([...processedCaseIds]));
  }, [processedCaseIds]);

  // Save dismissed notification IDs whenever they change
  useEffect(() => {
    localStorage.setItem('dismissedNotificationIds', JSON.stringify([...dismissedNotificationIds]));
  }, [dismissedNotificationIds]);
  
  // Check for new notifications when cases change
  useEffect(() => {
    // Prefer full case list when available to catch archived transitions
    const mergedById = new Map();
    (Array.isArray(cases) ? cases : []).forEach(c => mergedById.set(c.id, c));
    (Array.isArray(allCases) ? allCases : []).forEach(c => mergedById.set(c.id, { ...mergedById.get(c.id), ...c }));
    const sourceCases = Array.from(mergedById.values());
    
    if (!sourceCases || sourceCases.length === 0) {
      return;
    }
    
    const now = Date.now();
    let newNotifications = [];
    let processedIdsChanged = false;
    let updatedProcessedIds = new Set();
    
    // Use functional state updates to avoid dependency on current state
    setNotifications(currentNotifications => {
      const existingIds = new Set(currentNotifications.map(n => n.id));
      
      setProcessedCaseIds(currentProcessedIds => {
        updatedProcessedIds = new Set(currentProcessedIds);
        processedIdsChanged = false;
    
        // Check for new cases and new admissions
        sourceCases.forEach(caseItem => {
          const caseKey = `case-${caseItem.id}`;
          const admissionKey = `admission-${caseItem.id}`;
          
          // Check if this is a new case (not processed before)
          if (!currentProcessedIds.has(caseItem.id)) {
            if (!existingIds.has(caseKey) && !dismissedNotificationIds.has(caseKey)) {
              newNotifications.push({
                id: caseKey,
                title: caseItem.name,
                message: 'New Case Added',
                timestamp: new Date(),
                type: 'new',
                read: false,
                iconType: 'add',
                color: '#4CAF50', // Green
                caseId: caseItem.id,
                programType: caseItem.programType || caseItem.program_type || caseItem.caseType || caseItem.case_type
              });
            }
            
            updatedProcessedIds.add(caseItem.id);
            processedIdsChanged = true;
          }
          
          // Check for new admissions (active cases)
          if (!existingIds.has(admissionKey) && 
              !dismissedNotificationIds.has(admissionKey) && 
              (String(caseItem?.status || '').toLowerCase() === 'active' || 
               caseItem?.status === true ||
               caseItem?.isActive === true || 
               caseItem?.status === null || 
               caseItem?.status === undefined)) {
            
            newNotifications.push({
              id: admissionKey,
              title: caseItem.name,
              message: 'New Admission',
              timestamp: new Date(),
              type: 'admission',
              read: false,
              iconType: 'new',
              color: '#9C27B0', // Purple
              caseId: caseItem.id,
              programType: caseItem.programType || caseItem.program_type || caseItem.caseType || caseItem.case_type
            });
          }
          
          // Check for archived cases (status archived) regardless of whether it's a new case
          const archivedKey = `archived-${caseItem.id}`;
          const status = String(caseItem?.status || '').toLowerCase();
          
          // Check for all archived status variations
          const isArchived = status === 'archived' || 
                            status === 'archives' || 
                            status === 'reintegrate' || 
                            status === 'discharge' || 
                            status === 'closed' || 
                            status === 'completed' || 
                            status === 'inactive' ||
                            caseItem?.status === false;
          
          if (isArchived && !existingIds.has(archivedKey) && !dismissedNotificationIds.has(archivedKey)) {
            newNotifications.push({
              id: archivedKey,
              title: caseItem.name,
              message: 'Case Discharged',
              timestamp: new Date(),
              type: 'archived',
              read: false,
              iconType: 'update',
              color: '#2196F3', // Blue
              caseId: caseItem.id,
              programType: caseItem.programType || caseItem.program_type || caseItem.caseType || caseItem.case_type
            });
          }
          
          // Skip the rest of the checks for lastUpdated since we're using the ID-based approach now
        });
        
        // Generate follow-up reminders based on case age
        sourceCases.forEach(caseItem => {
          if (caseItem?.lastUpdated) {
            const updateDate = new Date(caseItem.lastUpdated);
            const daysSinceUpdate = Math.floor((now - updateDate.getTime()) / (1000 * 60 * 60 * 24));
            
            // Cases not updated in 30 days need follow-up
            if (daysSinceUpdate >= 30) {
              const notificationId = `followup-${caseItem.id}`;
              
              // Only add if this notification doesn't already exist
              if (!existingIds.has(notificationId) && !dismissedNotificationIds.has(notificationId)) {
                newNotifications.push({
                  id: notificationId,
                  title: 'Follow-up Reminder',
                  message: `Follow-up required for ${caseItem.name}'s case - no updates in ${daysSinceUpdate} days`,
                  timestamp: new Date(),
                  type: 'reminder',
                  read: false,
                  iconType: 'warning',
                  color: '#FF9800', // Orange
                  caseId: caseItem.id,
                  programType: caseItem.programType || caseItem.program_type || caseItem.caseType || caseItem.case_type
                });
              }
            }
          }
        });
        
        return processedIdsChanged ? updatedProcessedIds : currentProcessedIds;
      });
      
      // Only add new notifications if there are any
      if (newNotifications.length > 0) {
        // Combine new notifications with existing ones and limit to 50 most recent
        const combined = [...newNotifications, ...currentNotifications];
        const limited = combined.slice(0, 50);
        
        // Save to localStorage
        try {
          localStorage.setItem('caseNotifications', JSON.stringify(limited));
        } catch (error) {
          console.error('Error saving notifications to localStorage:', error);
        }
        
        return limited;
      }
      
      return currentNotifications;
    });
    
    // Update last checked time
    setLastChecked(now);
    localStorage.setItem('lastNotificationCheck', now.toString());
  }, [cases, allCases, dismissedNotificationIds]); // Re-evaluate when case lists or dismissed notifications change
  
  // Method to mark a notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prevNotifications => {
      const updated = prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      );
      
      // Save to localStorage
      try {
        localStorage.setItem('caseNotifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
      
      return updated;
    });
  };
  
  // Method to mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => {
      const updated = prevNotifications.map(notification => ({ ...notification, read: true }));
      
      // Save to localStorage
      try {
        localStorage.setItem('caseNotifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
      
      return updated;
    });
  };
  
  // Method to add a new notification
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: notification.timestamp || new Date(),
      read: notification.read || false
    };
    
    setNotifications(prev => {
      // Add new notification and limit to 5 most recent
      const updated = [newNotification, ...prev].slice(0, 5);
      
      // Save to localStorage
      try {
        localStorage.setItem('caseNotifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
      
      return updated;
    });
  };
  
  // Remove a single notification
  const removeNotification = (notificationId) => {
    // Track as dismissed so it won't be regenerated
    setDismissedNotificationIds(prev => new Set([...prev, notificationId]));
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== notificationId);
      try {
        localStorage.setItem('caseNotifications', JSON.stringify(updated));
      } catch (error) {
        console.error('Error saving notifications to localStorage:', error);
      }
      return updated;
    });
  };
  
  // Method to reset all notifications (for troubleshooting)
  const resetNotifications = () => {
    // Dismiss all current notifications but keep processed case IDs
    setDismissedNotificationIds(prev => new Set([...prev, ...notifications.map(n => n.id)]));
    setNotifications([]);
    try {
      localStorage.setItem('caseNotifications', JSON.stringify([]));
    } catch (error) {}
  };
  
  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;
  
  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    addNotification,
    removeNotification,
    resetNotifications,
    dismissedNotificationIds
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;