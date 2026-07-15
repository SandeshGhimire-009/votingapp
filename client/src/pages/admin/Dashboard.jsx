import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getSystemStats, getActivityLogs, getPendingRequests, getUsers, addAnnouncement, addNotification, getAnnouncements, getContestantRequests } from '../../utils/storage';
import { FaTv, FaUsers, FaVoteYea, FaClock, FaTrophy, FaChartBar, FaUserCheck, FaUserTimes, FaExclamationTriangle, FaEnvelope } from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, stats, refreshData } = useApp();
  const navigate = useNavigate();
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingContestantRequests, setPendingContestantRequests] = useState(0);
  const [newUsersCount, setNewUsersCount] = useState(0);
  const [announceForm, setAnnounceForm] = useState({ title: '', message: '' });
  const [announceMsg, setAnnounceMsg] = useState({ type: '', text: '' });
  const [recentAnnouncements, setRecentAnnouncements] = useState([]);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    
    loadData();

    // Auto-refresh every 3 seconds to sync with user actions
    const refreshInterval = setInterval(() => {
      loadData();
    }, 3000);

    const handleStorageChange = (event) => {
      const key = event?.key || '';
      if (
        key.includes('reality-voting-votes') ||
        key.includes('reality-voting-users') ||
        key.includes('reality-voting-contests') ||
        key.includes('reality-voting-contestants') ||
        key.includes('reality-voting-logs') ||
        key.includes('reality-voting-announcements') ||
        key.includes('reality-voting-notifications')
      ) {
        loadData();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('reality-voting-data-updated', handleDataUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('reality-voting-data-updated', handleDataUpdate);
    };
  }, [user, navigate]);

  const loadData = () => {
    const systemStats = getSystemStats();
    setDashboardStats(systemStats);
    
    const logs = getActivityLogs().slice(0, 10);
    setRecentLogs(logs);
    
    const requests = getPendingRequests().slice(0, 10);
    setPendingRequests(requests);
    
    // Count pending contestant requests
    const contestantRequests = getContestantRequests();
    const pendingCount = contestantRequests.filter(r => r.status === 'pending').length;
    setPendingContestantRequests(pendingCount);
    
    // Count new users (registered in last 24 hours)
    const allUsers = getUsers();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsers = allUsers.filter(u => {
      const createdDate = new Date(u.createdAt);
      return createdDate > oneDayAgo && !u.isAdmin;
    }).length;
    setNewUsersCount(newUsers);
    
    setRecentAnnouncements(getAnnouncements().slice(0, 5));
    
    refreshData();
  };

  const handleAnnounce = (e) => {
    e.preventDefault();
    if (!announceForm.title.trim() || !announceForm.message.trim()) {
      setAnnounceMsg({ type: 'error', text: 'Please provide both title and message.' });
      setTimeout(() => setAnnounceMsg({ type: '', text: '' }), 3000);
      return;
    }
    const item = addAnnouncement({ title: announceForm.title, message: announceForm.message, createdBy: user?.id });
    // Broadcast to all users as notification
    addNotification({
      userId: 'all',
      type: 'announcement',
      title: item.title,
      message: item.message,
      link: '/user/dashboard'
    });
    setAnnounceForm({ title: '', message: '' });
    setAnnounceMsg({ type: 'success', text: 'Announcement posted and users notified.' });
    setRecentAnnouncements(getAnnouncements().slice(0, 5));
    setTimeout(() => setAnnounceMsg({ type: '', text: '' }), 3000);
  };

  if (!user || !user.isAdmin) return null;

  return (
    <>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
        `}
      </style>
      <div style={{ width: '100%' }}>
        {/* Quick Announcement Composer */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '20px', marginBottom: '25px', alignItems: 'stretch' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Post Announcement</h2>
          {announceMsg.text && (
            <div style={{
              padding: '10px 12px', borderRadius: '10px', marginBottom: '12px',
              background: announceMsg.type === 'success' ? '#d4edda' : '#f8d7da',
              color: announceMsg.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${announceMsg.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {announceMsg.text}
            </div>
          )}
          <form onSubmit={handleAnnounce}>
            <input
              type="text"
              placeholder="Announcement Title"
              value={announceForm.title}
              onChange={(e) => setAnnounceForm(prev => ({ ...prev, title: e.target.value }))}
              style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', marginBottom: '10px' }}
            />
            <textarea
              placeholder="Type your announcement message..."
              rows={3}
              value={announceForm.message}
              onChange={(e) => setAnnounceForm(prev => ({ ...prev, message: e.target.value }))}
              style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '10px', marginBottom: '10px', resize: 'vertical' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" style={{ padding: '10px 18px', border: 'none', borderRadius: '10px', color: 'white', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 'bold' }}>
                Broadcast Announcement
              </button>
            </div>
          </form>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '12px' }}>Recent Announcements</h2>
          {recentAnnouncements.length === 0 ? (
            <div style={{ color: '#777' }}>No announcements yet.</div>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {recentAnnouncements.map(a => (
                <div key={a.id} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '10px' }}>
                  <div style={{ fontWeight: 'bold' }}>{a.title}</div>
                  <div style={{ color: '#555', fontSize: '0.95rem' }}>{a.message}</div>
                  <div style={{ color: '#999', fontSize: '0.8rem', marginTop: '6px' }}>{new Date(a.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 'bold' }}>
        Admin Dashboard
      </h1>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '25px', marginBottom: '40px' }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <FaUsers style={{ fontSize: '2rem', color: '#667eea' }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{dashboardStats?.totalUsers || 0}</div>
                <div style={{ color: '#666' }}>Total Users</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <FaUserCheck style={{ fontSize: '2rem', color: '#51cf66' }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{dashboardStats?.approvedUsers || 0}</div>
                <div style={{ color: '#666' }}>Approved Users</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <FaClock style={{ fontSize: '2rem', color: '#ffd43b' }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{dashboardStats?.pendingUsers || 0}</div>
                <div style={{ color: '#666' }}>Pending Users</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <FaVoteYea style={{ fontSize: '2rem', color: '#764ba2' }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{dashboardStats?.totalVotes || 0}</div>
                <div style={{ color: '#666' }}>Total Votes</div>
              </div>
            </div>
          </div>

          <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
              <FaChartBar style={{ fontSize: '2rem', color: '#11cdef' }} />
              <div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{dashboardStats?.totalBadges || 0}</div>
                <div style={{ color: '#666' }}>Badges Issued</div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Analytics Charts */}
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          marginBottom: '40px'
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaChartBar style={{ color: '#667eea' }} /> System Activity Analytics
          </h2>
          
          {(() => {
            const allLogs = getActivityLogs();
            const voteCount = allLogs.filter(log => log.type === 'vote').length;
            const loginCount = allLogs.filter(log => log.type === 'login').length;
            const registrationCount = allLogs.filter(log => log.type === 'registration').length;
            const totalActivities = voteCount + loginCount + registrationCount;
            
            const votePercent = totalActivities > 0 ? (voteCount / totalActivities) * 100 : 0;
            const loginPercent = totalActivities > 0 ? (loginCount / totalActivities) * 100 : 0;
            const registrationPercent = totalActivities > 0 ? (registrationCount / totalActivities) * 100 : 0;

            return (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '30px'
              }}>
                {/* Bar Chart */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  padding: '25px',
                  borderRadius: '16px',
                  border: '2px solid #e9ecef'
                }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '25px', color: '#333', fontWeight: '700' }}>System Activity Distribution</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>
                          <FaVoteYea style={{ color: '#51cf66', marginRight: '6px' }} /> Total Votes
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#51cf66' }}>{voteCount}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '12px',
                        background: '#e9ecef',
                        borderRadius: '20px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(votePercent, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #51cf66 0%, #40c057 100%)',
                          borderRadius: '20px',
                          transition: 'width 1s ease',
                          boxShadow: '0 2px 8px rgba(81, 207, 102, 0.3)'
                        }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>
                          <FaUserCheck style={{ color: '#667eea', marginRight: '6px' }} /> User Logins
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#667eea' }}>{loginCount}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '12px',
                        background: '#e9ecef',
                        borderRadius: '20px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(loginPercent, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                          borderRadius: '20px',
                          transition: 'width 1s ease',
                          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                        }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>
                          <FaUsers style={{ color: '#ffa94d', marginRight: '6px' }} /> Registrations
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#ffa94d' }}>{registrationCount}</span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '12px',
                        background: '#e9ecef',
                        borderRadius: '20px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${Math.min(registrationPercent, 100)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #ffa94d 0%, #fd7e14 100%)',
                          borderRadius: '20px',
                          transition: 'width 1s ease',
                          boxShadow: '0 2px 8px rgba(255, 169, 77, 0.3)'
                        }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie Chart */}
                <div style={{
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                  padding: '25px',
                  borderRadius: '16px',
                  border: '2px solid #e9ecef',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '20px', color: '#333', fontWeight: '700', alignSelf: 'flex-start' }}>Activity Breakdown</h3>
                  
                  <svg width="180" height="180" viewBox="0 0 180 180" style={{ marginBottom: '20px' }}>
                    <defs>
                      <filter id="adminShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                        <feOffset dx="0" dy="2" result="offsetblur"/>
                        <feComponentTransfer>
                          <feFuncA type="linear" slope="0.3"/>
                        </feComponentTransfer>
                        <feMerge>
                          <feMergeNode/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    {totalActivities > 0 ? (
                      <>
                        <circle
                          cx="90"
                          cy="90"
                          r="70"
                          fill="transparent"
                          stroke="#51cf66"
                          strokeWidth="40"
                          strokeDasharray={`${(votePercent / 100) * 439.8} 439.8`}
                          strokeDashoffset="0"
                          transform="rotate(-90 90 90)"
                          filter="url(#adminShadow)"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r="70"
                          fill="transparent"
                          stroke="#667eea"
                          strokeWidth="40"
                          strokeDasharray={`${(loginPercent / 100) * 439.8} 439.8`}
                          strokeDashoffset={`-${(votePercent / 100) * 439.8}`}
                          transform="rotate(-90 90 90)"
                          filter="url(#adminShadow)"
                        />
                        <circle
                          cx="90"
                          cy="90"
                          r="70"
                          fill="transparent"
                          stroke="#ffa94d"
                          strokeWidth="40"
                          strokeDasharray={`${(registrationPercent / 100) * 439.8} 439.8`}
                          strokeDashoffset={`-${((votePercent + loginPercent) / 100) * 439.8}`}
                          transform="rotate(-90 90 90)"
                          filter="url(#adminShadow)"
                        />
                        <circle cx="90" cy="90" r="40" fill="white" />
                        <text x="90" y="85" textAnchor="middle" style={{ fontSize: '24px', fontWeight: 'bold', fill: '#333' }}>{totalActivities}</text>
                        <text x="90" y="105" textAnchor="middle" style={{ fontSize: '12px', fill: '#999' }}>Total</text>
                      </>
                    ) : (
                      <>
                        <circle cx="90" cy="90" r="70" fill="#e9ecef" />
                        <circle cx="90" cy="90" r="40" fill="white" />
                        <text x="90" y="95" textAnchor="middle" style={{ fontSize: '14px', fill: '#999' }}>No Data</text>
                      </>
                    )}
                  </svg>
                  
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#51cf66' }}></div>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>Votes ({votePercent.toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#667eea' }}></div>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>Logins ({loginPercent.toFixed(0)}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: '#ffa94d' }}></div>
                      <span style={{ fontSize: '0.85rem', color: '#666' }}>Registrations ({registrationPercent.toFixed(0)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* User Requests */}
        {pendingRequests.length > 0 && (
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: '40px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaEnvelope style={{ color: '#667eea' }} /> Pending User Requests
                {pendingRequests.length > 0 && (
                  <span style={{
                    padding: '5px 12px',
                    background: '#ff6b6b',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '0.9rem',
                    fontWeight: 'bold',
                    marginLeft: '10px'
                  }}>
                    {pendingRequests.length}
                  </span>
                )}
              </h2>
              <Link
                to="/admin/users"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                View All
              </Link>
            </div>
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '10px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pendingRequests.map(request => {
                  const requestUser = getUsers().find(u => String(u.id) === String(request.userId));
                  return (
                    <div
                      key={request.id}
                      style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderRadius: '10px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                        <div>
                          <span style={{ fontWeight: 'bold', color: '#333', fontSize: '0.95rem' }}>
                            {request.requestType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request'}
                          </span>
                          {requestUser && (
                            <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.85rem' }}>
                              from {requestUser.name}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.8rem', color: '#999' }}>
                          {new Date(request.createdAt).toLocaleString()}
                        </span>
                      </div>
                      {request.data && (
                        <div style={{ marginTop: '8px' }}>
                          {request.requestType === 'username_change' && request.data.newUsername && (
                            <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
                              <strong>New Username:</strong> {request.data.newUsername}
                            </p>
                          )}
                          {request.data.reason && (
                            <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.85rem' }}>
                              <strong>Reason:</strong> {request.data.reason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
          <Link to="/admin/users" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
            >
              {newUsersCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  color: 'white',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(255, 107, 107, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  {newUsersCount}
                </div>
              )}
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUsers style={{ color: '#667eea' }} /> User Management
              </h3>
              <p style={{ color: '#666' }}>
                Manage users, approve accounts, and handle requests
                {newUsersCount > 0 && (
                  <span style={{ display: 'block', marginTop: '8px', color: '#ff6b6b', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {newUsersCount} new user{newUsersCount !== 1 ? 's' : ''} registered!
                  </span>
                )}
              </p>
            </div>
          </Link>

          <Link to="/admin/contests" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
            >
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaTv style={{ color: '#667eea' }} /> Contest Management
              </h3>
              <p style={{ color: '#666' }}>Create and manage contests and contestants</p>
            </div>
          </Link>

          <Link to="/admin/contestant-requests" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease', position: 'relative' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
            >
              {pendingContestantRequests > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '15px',
                  right: '15px',
                  background: 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
                  color: '#333',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.85rem',
                  boxShadow: '0 2px 8px rgba(255, 212, 59, 0.4)',
                  animation: 'pulse 2s infinite'
                }}>
                  {pendingContestantRequests}
                </div>
              )}
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUserCheck style={{ color: '#667eea' }} /> Contestant Requests
              </h3>
              <p style={{ color: '#666' }}>
                Review and approve contestant applications
                {pendingContestantRequests > 0 && (
                  <span style={{ display: 'block', marginTop: '8px', color: '#fcc419', fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {pendingContestantRequests} pending request{pendingContestantRequests !== 1 ? 's' : ''}!
                  </span>
                )}
              </p>
            </div>
          </Link>

          <Link to="/admin/results" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
            >
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaTrophy style={{ color: '#667eea' }} /> Results Control
              </h3>
              <p style={{ color: '#666' }}>View and publish contest results</p>
            </div>
          </Link>

          <Link to="/admin/settings" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
            >
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaChartBar style={{ color: '#667eea' }} /> System Settings
              </h3>
              <p style={{ color: '#666' }}>Configure system settings and preferences</p>
            </div>
          </Link>

          <Link to="/admin/logs" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)'; }}
            >
              <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaClock style={{ color: '#667eea' }} /> Activity Logs
              </h3>
              <p style={{ color: '#666' }}>View system activity and audit logs</p>
            </div>
          </Link>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
