import React, { useState, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext.jsx';
import { FaBell } from 'react-icons/fa';

const Sidebar = () => {
  const { user, userProfile } = useContext(AuthContext);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, resetNotifications, removeNotification } = useNotifications();

  const rawRole = (user?.role || '').toLowerCase();
  const isAdmin = rawRole.includes('admin');
  // legacy isRestricted removed; using admin/encoder

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  // Clear all notifications
  const clearAlerts = () => {
    resetNotifications();
    setShowNotifications(false);
  };

  // Mark a specific local alert as read
  const markLocalAlertAsRead = (id) => {
    markAsRead(id);
  };

  // Check if a navigation link is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Common styles for sidebar items
  const iconStyle = {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    fontSize: '1.25rem',
    marginBottom: '0.25rem'
  };
  
  const labelStyle = {
    width: '100%',
    textAlign: 'center',
    fontSize: '0.75rem'
  };
  
  const navLinkStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0.75rem 0',
    width: '100%'
  };

  return (
    <nav className="sidebar d-flex flex-column flex-shrink-0 text-white">
      {/* Profile Section */}
      <div className="sidebar-header p-3 d-flex justify-content-center">
        <div className="user-avatar bg-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
          {userProfile && userProfile.profileImage ? (
            <img 
              src={userProfile.profileImage} 
              alt="Profile" 
              className="rounded-circle" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : (
            <i className="fas fa-user text-primary"></i>
          )}
        </div>
      </div>
      
      {/* User Info */}
      <div className="d-flex flex-column align-items-center px-2 mb-3">
        <div className="fw-medium text-center w-100">{userProfile?.firstName || user?.name?.split(' ')[0] || user?.username || 'User'}</div>
        <div className="opacity-75 text-center w-100 mb-2">{user?.role || 'CICL Officer'}</div>
        
        {/* Notification bell */}
        <div className="position-relative mt-2" style={{ height: '24px' }}>
          <button 
            className="btn btn-link text-white p-0" 
            onClick={toggleNotifications}
            style={{ background: 'none', border: 'none' }}
          >
            <FaBell size={20} className={unreadCount > 0 ? "animate__animated animate__heartBeat animate__infinite" : ""} />
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Notification panel */}
      {showNotifications && (
        <div className="notification-panel bg-white text-dark p-3 position-fixed" 
             style={{ 
               left: '84px', 
               top: '0', 
               width: '320px', 
               zIndex: 1050,
               boxShadow: '0 0 10px rgba(0,0,0,0.1)',
               borderRadius: '0 8px 8px 0',
               maxHeight: '80vh',
               overflowY: 'auto'
             }}>
          <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
            <h6 className="m-0">Notifications</h6>
            <button 
              className="btn-close text-reset" 
              onClick={() => setShowNotifications(false)}
              aria-label="Close"
            ></button>
          </div>
          
          {notifications.length > 0 ? (
            <>
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`alert-item p-2 mb-2 rounded ${notification.read ? 'bg-light' : 'bg-info bg-opacity-10'}`}
                  style={{ 
                    cursor: 'pointer', 
                    borderLeft: `4px solid ${
                      notification.type === 'critical' ? '#dc3545' : 
                      notification.type === 'deadline' ? '#fd7e14' : '#0d6efd'
                    }`
                  }}
                  onClick={() => markLocalAlertAsRead(notification.id)}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className={`${!notification.read ? 'fw-bold' : ''}`}>{notification.title || notification.message}</span>
                    <div className="d-flex align-items-center">
                      {!notification.read && <span className="badge bg-primary rounded-pill me-2">New</span>}
                      <button 
                        type="button" 
                        className="btn-close"
                        aria-label="Dismiss"
                        onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }}
                      ></button>
                    </div>
                  </div>
                  <div className="mt-1">
                    <small className="text-muted me-2">{notification.message}</small>
                    {notification.programType && (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success">
                        {notification.programType}
                      </span>
                    )}
                  </div>
                  <small className="text-muted d-block mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </small>
                </div>
              ))}
              <div className="text-center mt-3">
                <button className="btn btn-sm btn-outline-secondary" onClick={clearAlerts}>
                  Clear All
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <i className="fas fa-bell-slash text-muted mb-3" style={{ fontSize: '2rem' }}></i>
              <p className="mb-0">No notifications</p>
              <small className="text-muted">You'll see notifications about cases and activities here</small>
            </div>
          )}
        </div>
      )}
      
      {/* Navigation */}
      <ul className="nav flex-column mb-auto p-0 mt-2 w-100">
        {isAdmin && (
          <li className="w-100 mb-3 text-center">
            <Link 
              to="/dashboard"
              className={`nav-link text-white w-100 ${isActiveLink('/dashboard') ? 'active' : ''}`} 
              style={navLinkStyle}
            >
              <div style={iconStyle}>
                <i className="fas fa-home"></i>
              </div>
              <div style={labelStyle}>Home</div>
            </Link>
          </li>
        )}
        <li className="w-100 mb-3 text-center">
          <Link 
            to="/cases"
            className={`nav-link text-white w-100 ${isActiveLink('/cases') ? 'active' : ''}`} 
            style={navLinkStyle}
          >
            <div style={iconStyle}>
              <i className="fas fa-briefcase"></i>
            </div>
            <div style={labelStyle}>Cases</div>
          </Link>
        </li>
        {isAdmin && (
          <li className="w-100 mb-3 text-center">
            <Link 
              to="/archived-cases"
              className={`nav-link text-white w-100 ${isActiveLink('/archived-cases') ? 'active' : ''}`} 
              style={navLinkStyle}
            >
              <div style={iconStyle}>
                <i className="fas fa-archive"></i>
              </div>
              <div style={labelStyle}>Discharged</div>
            </Link>
          </li>
        )}
        {isAdmin && (
          <li className="w-100 mb-3 text-center">
            <Link 
              to="/after-care"
              className={`nav-link text-white w-100 ${isActiveLink('/after-care') ? 'active' : ''}`} 
              style={navLinkStyle}
            >
              <div style={iconStyle}>
                <i className="fas fa-hands-helping"></i>
              </div>
              <div style={labelStyle}>After Care</div>
            </Link>
          </li>
        )}
        {isAdmin && (
          <li className="w-100 mb-3 text-center">
            <Link 
              to="/program"
              className={`nav-link text-white w-100 ${isActiveLink('/program') ? 'active' : ''}`} 
              style={navLinkStyle}
            >
              <div style={iconStyle}>
                <i className="fas fa-broadcast-tower"></i>
              </div>
              <div style={labelStyle}>Program</div>
            </Link>
          </li>
        )}
        {isAdmin && (
          <li className="w-100 mb-3 text-center">
            <Link 
              to="/reports"
              className={`nav-link text-white w-100 ${isActiveLink('/reports') ? 'active' : ''}`} 
              style={navLinkStyle}
            >
              <div style={iconStyle}>
                <i className="fas fa-file-alt"></i>
              </div>
              <div style={labelStyle}>Report</div>
            </Link>
          </li>
        )}
        <li className="w-100 text-center mt-auto">
          <Link 
            to="/settings"
            className={`nav-link text-white w-100 ${isActiveLink('/settings') ? 'active' : ''}`} 
            style={navLinkStyle}
          >
            <div style={iconStyle}>
              <i className="fas fa-cog"></i>
            </div>
            <div style={labelStyle}>Settings</div>
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;