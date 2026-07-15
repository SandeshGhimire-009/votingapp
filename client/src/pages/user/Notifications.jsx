import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { FaBell, FaArrowLeft, FaCheckCircle, FaInfoCircle, FaExclamationTriangle, FaTimesCircle, FaFilter, FaSearch, FaTrash } from 'react-icons/fa';

const Notifications = () => {
  const { user, initialized, notifications, markNotificationRead, markAllNotificationsRead, refreshData } = useApp();
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all'); // all, read, unread
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredNotifications, setFilteredNotifications] = useState([]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }
    filterNotifications();
    // Reset current page when filters or search terms change
    setCurrentPage(1);
  }, [initialized, user, navigate, notifications, filter, searchTerm]);

  const filterNotifications = () => {
    let filtered = notifications || [];

    // Filter out registration and pending notifications as requested
    // "remove user registered and pending approval or new user register part"
    // "only put the contest admin has added and only the approval part"
    const allowedTypes = [
      'voting_opened',
      'voting_closed',
      'contest_updated',
      'contestant_approved',
      'contestant_rejected',
      'account_approved',
      'account_rejected',
      'vote_confirmation',
      'results_published'
    ];

    filtered = filtered.filter(n => {
      // Allow if type is in whitelist OR if it's a generic message about contests/approvals that might have a different type key
      // We strictly filter out known "registration" types
      if (n.type === 'welcome' || n.type === 'account_pending' || n.type === 'new_user') return false;

      // For older notifications that might not have strict types, check titles
      const title = n.title?.toLowerCase() || '';
      if (title.includes('welcome') || title.includes('registration') || title.includes('pending approval')) return false;

      return true;
    });

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.read);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(term) ||
        n.message?.toLowerCase().includes(term)
      );
    }

    setFilteredNotifications(filtered);
  };

  const getNotificationIcon = (type) => {
    if (type?.includes('approved') || type === 'vote_confirmation') return FaCheckCircle;
    if (type?.includes('rejected')) return FaTimesCircle;
    if (type?.includes('warning')) return FaExclamationTriangle;
    return FaInfoCircle;
  };

  const getNotificationColor = (type) => {
    if (type?.includes('approved') || type === 'vote_confirmation') return '#51cf66';
    if (type?.includes('rejected')) return '#ff6b6b';
    if (type?.includes('warning')) return '#ffa94d';
    return '#667eea';
  };

  if (!user) return null;

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const currentItems = filteredNotifications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <section style={{ padding: '30px 0', minHeight: '100vh', background: '#f5f7fa' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <Link
            to="/user/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#667eea',
              textDecoration: 'none',
              marginBottom: '20px',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#764ba2'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#667eea'}
          >
            <FaArrowLeft /> Back to Dashboard
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h1 style={{
                fontSize: '2rem',
                marginBottom: '8px',
                color: '#2c3e50',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}>
                  <FaBell />
                </div>
                Notifications
              </h1>
              <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
                You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllNotificationsRead && markAllNotificationsRead()}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                }}
              >
                <FaCheckCircle /> Mark All as Read
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          minHeight: '400px'
        }}>
          {/* Filters and Search */}
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '30px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1, minWidth: '250px' }}>
              <div style={{ position: 'relative' }}>
                <FaSearch style={{
                  position: 'absolute',
                  left: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '1rem'
                }} />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 15px 12px 45px',
                    borderRadius: '12px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setFilter('all')}
                style={{
                  padding: '12px 20px',
                  background: filter === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                  color: filter === 'all' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                style={{
                  padding: '12px 20px',
                  background: filter === 'unread' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                  color: filter === 'unread' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter('read')}
                style={{
                  padding: '12px 20px',
                  background: filter === 'read' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f5f5f5',
                  color: filter === 'read' ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}
              >
                Read
              </button>
            </div>
          </div>

          {/* Notifications List */}
          {currentItems.length > 0 ? (
            <div style={{
              display: 'grid',
              gap: '15px'
            }}>
              {currentItems.map(notif => {
                const Icon = getNotificationIcon(notif.type);
                const color = getNotificationColor(notif.type);

                return (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read && markNotificationRead) {
                        markNotificationRead(notif.id);
                      }
                      if (notif.link) navigate(notif.link);
                    }}
                    style={{
                      padding: '20px',
                      background: notif.read ? 'white' : 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                      borderRadius: '16px',
                      border: notif.read ? '2px solid #e0e0e0' : `2px solid ${color}40`,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      gap: '15px',
                      alignItems: 'start',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Unread Indicator */}
                    {!notif.read && (
                      <div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: color,
                        boxShadow: `0 0 0 3px ${color}30`
                      }}></div>
                    )}

                    {/* Icon */}
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '14px',
                      background: `${color}20`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon style={{ fontSize: '1.5rem', color: color }} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontWeight: notif.read ? '600' : 'bold',
                        fontSize: '1.1rem',
                        color: '#333',
                        marginBottom: '8px'
                      }}>
                        {notif.title || 'Notification'}
                      </div>
                      <div style={{
                        color: '#666',
                        fontSize: '0.95rem',
                        marginBottom: '10px',
                        lineHeight: '1.5'
                      }}>
                        {notif.message}
                      </div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#999',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <FaBell style={{ fontSize: '0.75rem' }} />
                        {new Date(notif.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              padding: '80px 20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderRadius: '16px',
              border: '2px dashed rgba(102, 126, 234, 0.2)'
            }}>
              <FaBell style={{ fontSize: '5rem', color: '#ccc', marginBottom: '20px' }} />
              <h3 style={{ marginBottom: '10px', color: '#666', fontSize: '1.5rem' }}>No Notifications</h3>
              <p style={{ color: '#999', fontSize: '1rem' }}>
                {searchTerm ? 'No notifications match your search' : 'You\'re all caught up!'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '30px'
            }}>
              <div style={{
                display: 'flex',
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
              }}>
                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.max(1, prev - 1));
                    window.scrollTo(0, 0);
                  }}
                  disabled={currentPage === 1}
                  style={{
                    padding: '10px 18px',
                    background: 'white',
                    border: 'none',
                    borderRight: '1px solid #e0e0e0',
                    color: currentPage === 1 ? '#adb5bd' : '#667eea',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Previous
                </button>

                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => {
                      setCurrentPage(i + 1);
                      window.scrollTo(0, 0);
                    }}
                    style={{
                      padding: '10px 18px',
                      background: currentPage === i + 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
                      border: 'none',
                      borderRight: i + 1 === totalPages ? 'none' : '1px solid #e0e0e0',
                      color: currentPage === i + 1 ? 'white' : '#667eea',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {i + 1}
                  </button>
                ))}

                <button
                  onClick={() => {
                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                    window.scrollTo(0, 0);
                  }}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '10px 18px',
                    background: 'white',
                    border: 'none',
                    color: currentPage === totalPages ? '#adb5bd' : '#667eea',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Notifications;
