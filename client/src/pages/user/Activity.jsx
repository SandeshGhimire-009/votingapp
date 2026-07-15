import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getActivityLogsByUserId, deleteActivityLog, clearUserActivityLogs } from '../../utils/storage';
import { FaHistory, FaVoteYea, FaCheckCircle, FaUser, FaCog, FaClock, FaFilter, FaTrash, FaTimesCircle } from 'react-icons/fa';

const Activity = () => {
  const { user, initialized } = useApp();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [filterDuration, setFilterDuration] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }
    loadActivities();
  }, [initialized, user, navigate]);

  const loadActivities = () => {
    if (user) {
      const logs = getActivityLogsByUserId(user.id);
      setActivities(logs);
    }
  };

  const handleDeleteActivity = (logId) => {
    if (window.confirm('Are you sure you want to delete this activity record?')) {
      deleteActivityLog(logId);
      loadActivities();
      setMessage({ type: 'success', text: 'Activity record deleted.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear your entire activity history? This cannot be undone.')) {
      clearUserActivityLogs(user.id);
      loadActivities();
      setMessage({ type: 'success', text: 'Activity history cleared.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const getActivityIcon = (type) => {
    if (type === 'vote') return <FaVoteYea />;
    if (type === 'login') return <FaCheckCircle />;
    if (type === 'profile_update') return <FaUser />;
    if (type === 'request_submitted') return <FaCog />;
    return <FaHistory />;
  };

  const getActivityColor = (type) => {
    if (type === 'vote') return '#2dce89';
    if (type === 'login') return '#11cdef';
    if (type === 'profile_update') return '#5e72e4';
    if (type === 'request_submitted') return '#fb6340';
    return '#adb5bd';
  };

  const getActivityLabel = (type) => {
    if (type === 'vote') return 'Voted in Contest';
    if (type === 'login') return 'Account Login';
    if (type === 'profile_update') return 'Profile Updated';
    if (type === 'request_submitted') return 'Application Submitted';
    return 'General Activity';
  };

  const getFilteredActivities = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).getTime();

    return activities.filter(log => {
      // Date Filter
      const logTime = new Date(log.timestamp).getTime();
      let dateMatch = true;
      if (filterDuration === 'today') dateMatch = logTime >= today;
      if (filterDuration === 'week') dateMatch = logTime >= weekAgo;
      if (filterDuration === 'month') dateMatch = logTime >= monthAgo;

      // Type Filter
      let typeMatch = true;
      if (filterType !== 'all') typeMatch = log.type === filterType;
      return dateMatch && typeMatch;
    });
  };
  const filteredActivities = getFilteredActivities();

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDuration, filterType]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const displayTotalPages = Math.max(1, totalPages);
  const pagesPerChunk = 4;
  const chunkStart = Math.floor((currentPage - 1) / pagesPerChunk) * pagesPerChunk + 1;
  const chunkEnd = Math.min(displayTotalPages, chunkStart + pagesPerChunk - 1);
  const visiblePages = Array.from({ length: Math.max(0, chunkEnd - chunkStart + 1) }, (_, i) => chunkStart + i);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < displayTotalPages;

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const currentItems = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) return null;

  return (
    <div style={{ maxWidth: '980px', margin: '0 auto 0 12px', paddingBottom: '40px' }}>
      <div style={{
        marginBottom: '30px',
        background: 'linear-gradient(87deg, #11cdef 0, #1171ef 100%)',
        padding: '30px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FaHistory /> My Activity Log
        </h1>
        <p style={{ margin: '8px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
          History of your interactions and updates
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '12px',
          marginBottom: '25px',
          background: message.type === 'success' ? '#2dce89' : '#f5365c',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {message.text}
        </div>
      )}

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '30px',
        boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#525f7f', fontWeight: 600 }}>
          <FaFilter /> Filters:
        </div>

        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          {/* Duration Select */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#8898aa', marginBottom: '5px' }}>Time Period</label>
            <select
              value={filterDuration}
              onChange={(e) => setFilterDuration(e.target.value)}
              style={{
                padding: '10px 15px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                fontSize: '14px',
                color: '#32325d',
                minWidth: '150px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>

          {/* Type Select */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#8898aa', marginBottom: '5px' }}>Activity Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{
                padding: '10px 15px',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                fontSize: '14px',
                color: '#32325d',
                minWidth: '150px',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="all">All Types</option>
              <option value="vote">Votes</option>
              <option value="login">Logins</option>
              <option value="profile_update">Profile Updates</option>
              <option value="request_submitted">Applications</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleClearAll}
          style={{
            marginLeft: 'auto',
            padding: '12px 20px',
            background: '#f5365c',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaTrash /> Clear History
        </button>
      </div>

      {filteredActivities.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)'
        }}>
          <FaHistory style={{ fontSize: '4rem', color: '#e9ecef', marginBottom: '20px' }} />
          <h3 style={{ color: '#8898aa', marginBottom: '10px' }}>No activity found</h3>
          <p style={{ color: '#adb5bd' }}>The selected filters didn't match any records.</p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)',
          overflow: 'hidden'
        }}>
          {currentItems.map((log, idx) => (
            <div
              key={idx}
              style={{
                padding: '14px 18px',
                borderBottom: idx !== currentItems.length - 1 ? '1px solid #f0f0f0' : 'none',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f6f9fc'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: `${getActivityColor(log.type)}20`,
                color: getActivityColor(log.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0
              }}>
                {getActivityIcon(log.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ margin: 0, color: '#32325d', fontWeight: 600, fontSize: '14px' }}>
                  {getActivityLabel(log.type)}
                </h4>
                <p style={{ margin: '3px 0 0', color: '#8898aa', fontSize: '12px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                  {log.details || 'System activity recorded'}
                </p>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#8898aa',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                paddingTop: '1px'
              }}>
                <FaClock /> {new Date(log.timestamp).toLocaleString()}
              </div>

              <button
                onClick={() => handleDeleteActivity(log.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f5365c',
                  cursor: 'pointer',
                  padding: '8px',
                  fontSize: '0.9rem',
                  opacity: 0.5,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                onMouseLeave={(e) => e.currentTarget.style.opacity = 0.5}
                title="Delete activity"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {filteredActivities.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '30px',
          padding: '0 12px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: '#f8fafc',
            border: '1px solid #eef2f7',
            borderRadius: '999px',
            padding: '7px 9px',
            flexWrap: 'wrap',
            boxShadow: '0 7px 18px rgba(50, 50, 93, 0.09)'
          }}>
            <button
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo(0, 0);
              }}
              disabled={!hasPreviousPage}
              style={{
                width: '36px',
                height: '36px',
                background: '#eef2f7',
                border: '1px solid #e1e8f0',
                borderRadius: '50%',
                color: hasPreviousPage ? '#94a3b8' : '#cbd5e1',
                cursor: hasPreviousPage ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                lineHeight: 1
              }}
              title="Previous page"
            >
              ←
            </button>

            {visiblePages.map((page) => (
              <button
                key={page}
                onClick={() => {
                  setCurrentPage(page);
                  window.scrollTo(0, 0);
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  background: currentPage === page ? '#6f7ff2' : '#f1f5f9',
                  border: currentPage === page ? '1px solid #6f7ff2' : '1px solid #e1e8f0',
                  borderRadius: '50%',
                  color: currentPage === page ? '#ffffff' : '#6f7ff2',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.88rem',
                  transition: 'all 0.2s ease',
                  lineHeight: 1,
                  boxShadow: currentPage === page ? '0 7px 14px rgba(111, 127, 242, 0.2)' : 'none'
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => {
                setCurrentPage(prev => Math.min(displayTotalPages, prev + 1));
                window.scrollTo(0, 0);
              }}
              disabled={!hasNextPage}
              style={{
                width: '36px',
                height: '36px',
                background: '#eef2f7',
                border: '1px solid #e1e8f0',
                borderRadius: '50%',
                color: hasNextPage ? '#94a3b8' : '#cbd5e1',
                cursor: hasNextPage ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease',
                lineHeight: 1
              }}
              title="Next page"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activity;
