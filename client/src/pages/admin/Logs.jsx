import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getActivityLogs, getUsers, deleteActivityLog, setActivityLogs } from '../../utils/storage';
import { FaHistory, FaUser, FaVoteYea, FaCheckCircle, FaTimesCircle, FaBan, FaRedo, FaCog, FaTrophy, FaSearch, FaFilter, FaTrash } from 'react-icons/fa';

const AdminLogs = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    loadLogs();
  }, [user, navigate]);

  useEffect(() => {
    filterLogs();
  }, [searchTerm, filterType, logs]);

  const loadLogs = () => {
    const allLogs = getActivityLogs();
    setLogs(allLogs);
    setFilteredLogs(allLogs);
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log => {
        const action = (log.action || '').toLowerCase();
        const user = getUsers().find(u => String(u.id) === String(log.userId));
        const userName = user ? user.name.toLowerCase() : '';
        return action.includes(term) || userName.includes(term);
      });
    }

    setFilteredLogs(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleDeleteLog = (logId) => {
    if (window.confirm('Are you sure you want to delete this log entry?')) {
      deleteActivityLog(logId);
      loadLogs();
      setMessage({ type: 'success', text: 'Log entry deleted.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to CLEAR ALL activity logs? This action cannot be undone.')) {
      setActivityLogs([]);
      loadLogs();
      setMessage({ type: 'success', text: 'All logs cleared.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const pagesPerChunk = 4;
  const chunkStart = Math.floor((currentPage - 1) / pagesPerChunk) * pagesPerChunk + 1;
  const chunkEnd = Math.min(totalPages, chunkStart + pagesPerChunk - 1);
  const visiblePages = Array.from({ length: Math.max(0, chunkEnd - chunkStart + 1) }, (_, i) => chunkStart + i);
  const hasPreviousChunk = chunkStart > 1;
  const hasNextChunk = chunkEnd < totalPages;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const getLogIcon = (type) => {
    const icons = {
      login: FaUser,
      logout: FaUser,
      register: FaUser,
      vote: FaVoteYea,
      user_approved: FaCheckCircle,
      user_rejected: FaTimesCircle,
      user_suspended: FaBan,
      user_restored: FaRedo,
      user_created: FaUser,
      user_updated: FaUser,
      user_deleted: FaTimesCircle,
      vote_reset: FaRedo,
      profile_update: FaCog,
      request_submitted: FaCog,
      contest_created: FaTrophy,
      contest_updated: FaTrophy,
      contest_deleted: FaTimesCircle
    };
    return icons[type] || FaHistory;
  };

  const getLogColor = (type) => {
    if (type.includes('approved') || type === 'vote' || type === 'login') return '#51cf66';
    if (type.includes('rejected') || type.includes('deleted') || type === 'logout') return '#ff6b6b';
    if (type.includes('suspended') || type.includes('warning')) return '#ff9800';
    return '#667eea';
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto 0 12px' }}>
      <h1 style={{
        fontSize: '2.5rem',
        marginBottom: '30px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <FaHistory /> Activity Logs
      </h1>

      {message.text && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '12px',
          marginBottom: '25px',
          background: message.type === 'success' ? '#51cf66' : '#ff6b6b',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        marginBottom: '30px',
        display: 'flex',
        gap: '15px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px 12px 45px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaFilter style={{ color: '#667eea' }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '12px 15px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            <option value="all">All Activities</option>
            <option value="login">Logins</option>
            <option value="logout">Logouts</option>
            <option value="vote">Votes</option>
            <option value="user_approved">User Approvals</option>
            <option value="user_rejected">User Rejections</option>
            <option value="user_suspended">User Suspensions</option>
            <option value="vote_reset">Vote Resets</option>
            <option value="contest_created">Contest Creation</option>
          </select>
        </div>
        <button
          onClick={handleClearAll}
          style={{
            marginLeft: 'auto',
            padding: '12px 20px',
            background: '#ff6b6b',
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
          <FaTrash /> Clear All Logs
        </button>
      </div>

      {/* Logs List */}
      <div style={{
        background: 'white',
        padding: '22px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <FaHistory style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }} />
            <h3>No Logs Found</h3>
            <p>{searchTerm || filterType !== 'all' ? 'Try adjusting your filters' : 'No activity logs yet'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {currentItems.map((log) => {
              const Icon = getLogIcon(log.type);
              const color = getLogColor(log.type);
              const logUser = getUsers().find(u => String(u.id) === String(log.userId));

              return (
                <div
                  key={log.id}
                  style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '15px',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'start',
                    gap: '14px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = color;
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e0e0e0';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    fontSize: '1.05rem',
                    flexShrink: 0
                  }}>
                    <Icon />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px', flexWrap: 'wrap', gap: '10px' }}>
                      <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 'bold', color: '#333' }}>
                        {log.action || log.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <span style={{ fontSize: '0.78rem', color: '#999' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {logUser && (
                        <span style={{ fontSize: '0.82rem', color: '#666' }}>
                          <strong>User:</strong> {logUser.name} ({logUser.email})
                        </span>
                      )}
                      {log.type && (
                        <span style={{
                          padding: '4px 10px',
                          background: `${color}20`,
                          color: color,
                          borderRadius: '12px',
                          fontSize: '0.74rem',
                          fontWeight: 'bold'
                        }}>
                          {log.type.replace('_', ' ')}
                        </span>
                      )}
                      {log.contestId && (
                        <span style={{ fontSize: '0.82rem', color: '#666' }}>
                          <strong>Contest ID:</strong> {log.contestId}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteLog(log.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      padding: '8px',
                      fontSize: '0.95rem',
                      opacity: 0.6,
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = 0.6}
                    title="Delete log entry"
                  >
                    <FaTrash />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f2f4f8',
            border: '1px solid #e2e6ee',
            borderRadius: '999px',
            padding: '10px 14px',
            flexWrap: 'wrap',
            boxShadow: '0 10px 24px rgba(50, 50, 93, 0.12)'
          }}>
            <button
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - pagesPerChunk));
                window.scrollTo(0, 0);
              }}
              disabled={!hasPreviousChunk}
              style={{
                width: '44px',
                height: '44px',
                background: '#eceff4',
                border: '1px solid #d7dde8',
                borderRadius: '50%',
                color: hasPreviousChunk ? '#8a96ab' : '#c6ccd8',
                cursor: hasPreviousChunk ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '1rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
              title="Previous pages"
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
                  width: '44px',
                  height: '44px',
                  background: currentPage === page ? '#667eea' : '#f1f3f7',
                  border: currentPage === page ? 'none' : '1px solid #d8deea',
                  borderRadius: '50%',
                  color: currentPage === page ? 'white' : '#667eea',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  lineHeight: 1,
                  transition: 'all 0.2s ease'
                }}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + pagesPerChunk));
                window.scrollTo(0, 0);
              }}
              disabled={!hasNextChunk}
              style={{
                width: '44px',
                height: '44px',
                background: '#eceff4',
                border: '1px solid #d7dde8',
                borderRadius: '50%',
                color: hasNextChunk ? '#667eea' : '#c6ccd8',
                cursor: hasNextChunk ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '1rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
              title="Next pages"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
