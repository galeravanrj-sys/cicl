import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.jsx';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Divider,
  IconButton,
  Badge,
  Chip,
  Tab,
  Tabs,
  Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CaseIcon from '@mui/icons-material/Folder';
import UpdateIcon from '@mui/icons-material/Update';
import CommentIcon from '@mui/icons-material/Comment';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, resetNotifications } = useNotifications();
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  
  // Debug logging for notifications
  useEffect(() => {
    console.log('Current notifications:', notifications);
    console.log('Unread count:', unreadCount);
  }, [notifications, unreadCount]);
  
  // Format the timestamp
  const formatTimestamp = (timestamp) => {
    if (isToday(timestamp)) {
      return `Today, ${format(timestamp, 'h:mm a')}`;
    } else if (isYesterday(timestamp)) {
      return `Yesterday, ${format(timestamp, 'h:mm a')}`;
    } else {
      return formatDistanceToNow(timestamp, { addSuffix: true });
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleReset = () => {
    if (window.confirm('This will clear all notifications. Are you sure?')) {
      resetNotifications();
    }
  };

  // Handle notification click to navigate to specific case
  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    markAsRead(notification.id);
    
    // Navigate based on notification type and caseId
    if (notification.caseId) {
      if (notification.type === 'archived' || notification.type === 'reintegration') {
        // Navigate to Settings page and highlight the specific case
        navigate('/settings', { 
          state: { 
            highlightCaseId: notification.caseId,
            searchTerm: '' // Clear any existing search to ensure case is visible
          } 
        });
      } else {
        // For other notification types, navigate to the appropriate tab
        navigate('/cases', { 
          state: { 
            highlightCaseId: notification.caseId,
            searchTerm: ''
          } 
        });
      }
    } else {
      // Fallback navigation if no caseId
      navigate('/cases');
    }
  };
  
  // Get the appropriate icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new-case':
        return <CaseIcon />;
      case 'status-change':
        return <UpdateIcon />;
      case 'archived':
        return <UpdateIcon />;
      case 'reintegration': // legacy type support
        return <UpdateIcon />;
      case 'admission':
        return <AssignmentIcon />;
      case 'reminder':
        return <WarningIcon />;
      case 'assignment':
        return <AssignmentIcon />;
      case 'comment':
        return <CommentIcon />;
      default:
        return <InfoIcon />;
    }
  };
  
  // Get the appropriate color based on notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case 'new-case':
        return '#4CAF50'; // Green
      case 'status-change':
        return '#2196F3'; // Blue
      case 'reintegration':
        return '#2196F3'; // Blue
      case 'admission':
        return '#9C27B0'; // Purple
      case 'reminder':
        return '#FF9800'; // Orange
      case 'assignment':
        return '#9C27B0'; // Purple
      case 'comment':
        return '#00BCD4'; // Cyan
      default:
        return '#757575'; // Grey
    }
  };
  
  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 0 
    ? notifications 
    : activeTab === 1 
      ? notifications.filter(notification => !notification.read)
      : notifications.filter(notification => notification.read);

  // Check if we have any notifications at all
  const hasNotifications = notifications && notifications.length > 0;

  // Log the filtered notifications for debugging
  console.log('Filtered notifications for tab', activeTab, ':', filteredNotifications);

  return (
    <Box sx={{ padding: 3, maxWidth: '900px', margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Notifications
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            startIcon={<RestartAltIcon />}
            onClick={handleReset}
          >
            Reset
          </Button>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsIcon color="primary" fontSize="large" />
          </Badge>
        </Box>
      </Box>
      
      {!hasNotifications ? (
        <Paper elevation={2} sx={{ borderRadius: 2, p: 4, textAlign: 'center' }}>
          <NotificationsOffIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom color="text.secondary">
            No Notifications Yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: '500px', mx: 'auto' }}>
            You don't have any notifications at the moment. Notifications will appear here when there are updates to your cases, such as new cases, status changes, or reminders.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Notification Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange} aria-label="notification tabs">
              <Tab label="All" />
              <Tab label={`Unread (${unreadCount})`} />
              <Tab label="Read" />
            </Tabs>
          </Box>
          
          {/* Toolbar */}
          <Box sx={{ 
            padding: 1.5, 
            display: 'flex', 
            justifyContent: 'flex-end', 
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)' 
          }}>
            <Chip 
              label="Mark all as read" 
              size="small" 
              color="primary" 
              variant="outlined"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
          
          {/* Notification List */}
          <List sx={{ padding: 0 }}>
            {filteredNotifications.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <InfoIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  {activeTab === 0 
                    ? "No notifications to display" 
                    : activeTab === 1 
                      ? "No unread notifications" 
                      : "No read notifications"}
                </Typography>
              </Box>
            ) : (
              filteredNotifications.map((notification) => (
                <React.Fragment key={notification.id}>
                  <ListItem 
                    alignItems="flex-start"
                    sx={{ 
                      padding: 2,
                      backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.05)',
                      transition: 'background-color 0.3s',
                      cursor: notification.caseId ? 'pointer' : 'default',
                      '&:hover': {
                        backgroundColor: notification.caseId ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                    onClick={() => notification.caseId && handleNotificationClick(notification)}
                    secondaryAction={
                      !notification.read && (
                        <IconButton 
                          edge="end" 
                          aria-label="mark as read" 
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering the navigation
                            markAsRead(notification.id);
                          }}
                        >
                          <CheckCircleIcon color="action" />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: notification.color || getNotificationColor(notification.type) }}>
                        {notification.iconType ? getNotificationIcon(notification.iconType) : getNotificationIcon(notification.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight={notification.read ? 'normal' : 'medium'}>
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <React.Fragment>
                          <Typography
                            component="span"
                            variant="body2"
                            color="text.primary"
                            sx={{ display: 'block', mb: 0.5 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(notification.timestamp)}
                          </Typography>
                        </React.Fragment>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Notifications;