import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { getUnreadNotificationCount, getNotificationsByUserId, updateSettings } from '../utils/storage';
import { FaTv, FaUser, FaSignOutAlt, FaBell, FaMoon, FaSun, FaUsers, FaChartBar, FaClipboardList, FaHistory } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout, isAuthenticated, notifications, settings, contests } = useApp();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [theme, setTheme] = useState(settings?.theme || 'light');
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasPublishedResults, setHasPublishedResults] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const hasPublished = contests.some(contest => contest.resultsPublished !== false || contest.status === 'closed' || contest.status === 'active');
    setHasPublishedResults(hasPublished);
  }, [contests]);

  useEffect(() => {
    if (settings?.theme && settings.theme !== theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme]);

  useEffect(() => {
    if (user) {
      const count = getUnreadNotificationCount(user.id);
      setUnreadCount(count);
    }
  }, [user, notifications]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    updateSettings({ theme });
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const userNotifications = user ? getNotificationsByUserId(user.id).slice(0, 5) : [];

  // Only show navbar if authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--surface)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        maxWidth: '1100px',
        margin: '0 auto'
      }}>
        {/* Logo */}
        <Link
          to={user?.isAdmin ? '/admin/dashboard' : '/user/dashboard'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'var(--text)',
            fontWeight: 'bold',
            fontSize: '1.3rem'
          }}
        >
          {settings?.logo ? (
            <img src={settings.logo} alt="Logo" style={{ height: '32px', borderRadius: '5px' }} />
          ) : (
            <FaTv style={{
              fontSize: '1.8rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }} />
          )}
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {settings?.systemName || 'Reality Voting'}
          </span>
        </Link>

        {/* Center Navigation - Only for non-admin users */}
        {!user.isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Link to="/user/dashboard" style={{ textDecoration: 'none', color: 'var(--text)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}>Dashboard</Link>
            <Link to="/user/vote" style={{ textDecoration: 'none', color: 'var(--text)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}>Vote</Link>
            {hasPublishedResults && (
              <Link to="/user/results" style={{ textDecoration: 'none', color: 'var(--text)', padding: '8px 14px', borderRadius: '10px', fontSize: '0.95rem', fontWeight: '500', transition: 'all 0.3s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}>Results</Link>
            )}
          </div>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginRight: 'clamp(8px, 4vw, 56px)' }}>
          {/* Notifications */}
          <div style={{ position: 'relative' }} ref={notificationsRef}>
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              style={{
                position: 'relative',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '10px 14px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)';
                e.currentTarget.style.borderColor = 'var(--accent-1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-5px',
                  right: '-5px',
                  background: 'var(--danger)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold'
                }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {notificationsOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                width: '320px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                padding: '8px'
              }}>
                <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1rem' }}>Notifications</strong>
                  <Link
                    to="/user/notifications"
                    onClick={() => setNotificationsOpen(false)}
                    style={{ fontSize: '0.85rem', color: 'var(--accent-1)', textDecoration: 'none' }}
                  >
                    View All
                  </Link>
                </div>
                {userNotifications.length > 0 ? (
                  <div>
                    {userNotifications.map(notif => (
                      <div
                        key={notif.id}
                        style={{
                          padding: '12px',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'background 0.2s',
                          background: notif.read ? 'transparent' : 'var(--surface)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'transparent' : 'var(--surface)'}
                        onClick={() => {
                          if (notif.link) navigate(notif.link);
                          setNotificationsOpen(false);
                        }}
                      >
                        <div style={{ fontWeight: notif.read ? 'normal' : 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
                          {notif.title}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                          {notif.message}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
                          {new Date(notif.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
                    No notifications
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.borderColor = 'var(--accent-1)';
              e.currentTarget.style.transform = 'rotate(15deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>

          {/* Profile Dropdown */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 14px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'white',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.9rem'
              }}>
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span style={{ fontSize: '0.9rem' }}>{user.name?.split(' ')[0]}</span>
            </button>

            {dropdownOpen && (
              <div style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 10px)',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                width: '220px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: '600' }}>{user.name}</div>

                {!user.isAdmin ? (
                  <>
                    <Link to="/user/profile" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}><FaUser style={{ minWidth: '16px' }} /> Profile</Link>
                    <Link to="/user/requests" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}><FaClipboardList style={{ minWidth: '16px' }} /> Applications</Link>
                    <Link to="/user/activity" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}><FaHistory style={{ minWidth: '16px' }} /> Activity</Link>
                  </>
                ) : (
                  <>
                    <Link to="/admin/users" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}><FaUsers style={{ minWidth: '16px' }} /> Users</Link>
                    <Link to="/admin/contests" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}><FaTv style={{ minWidth: '16px' }} /> Contests</Link>
                    <Link to="/admin/results" onClick={() => setDropdownOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', textDecoration: 'none', color: 'var(--text)', transition: 'all 0.2s', fontSize: '0.9rem' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--accent-1)'; }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text)'; }}><FaChartBar style={{ minWidth: '16px' }} /> Results</Link>
                  </>
                )}

                <button
                  onClick={() => { setDropdownOpen(false); handleLogout(); }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(224, 49, 49, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
