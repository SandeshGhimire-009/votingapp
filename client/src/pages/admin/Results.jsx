import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import {
  FaChartBar, FaEye, FaEyeSlash, FaCheckCircle, FaTimesCircle,
  FaLock, FaUnlock, FaSearch, FaTrophy, FaFire, FaUsers,
  FaExchangeAlt, FaChartPie, FaChartLine, FaTrash, FaSync
} from 'react-icons/fa';

const AdminResults = () => {
  const { user, refreshData } = useApp();
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [expandedContests, setExpandedContests] = useState({});
  const [selectedContest, setSelectedContest] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareContest1, setCompareContest1] = useState(null);
  const [compareContest2, setCompareContest2] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(false);

  const results = Array.isArray(selectedContest?.candidates)
    ? selectedContest.candidates
        .map(candidate => ({
          id: candidate.id,
          name: candidate.name,
          votes: candidate.votes || 0,
          percentage: selectedContest.totalVotes > 0
            ? ((candidate.votes || 0) / selectedContest.totalVotes * 100).toFixed(2)
            : 0,
          party: candidate.party
        }))
        .sort((a, b) => (b.votes || 0) - (a.votes || 0))
    : [];

  const loadContests = useCallback(async () => {
    setLoading(true);
    try {
      const allContests = await adminFetch('/api/elections');
      const normalizedContests = Array.isArray(allContests) ? allContests : [];
      setContests(normalizedContests);
      setFilteredContests(normalizedContests);
      setMessage({ type: '', text: '' });
    } catch (error) {
      console.error('Failed to load contests:', error);
      setMessage(prev => (
        prev.type === 'error' && prev.text === 'Failed to load contests'
          ? prev
          : { type: 'error', text: 'Failed to load contests' }
      ));
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePublishStatus = async (contest, nextPublished) => {
    try {
      setLoading(true);
      await adminFetch(`/api/admin/elections/${contest.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ resultsPublished: nextPublished })
      });
      setMessage({
        type: 'success',
        text: `${contest.title} ${nextPublished ? 'published' : 'unpublished'} successfully`
      });
      await loadContests();
    } catch (error) {
      console.error('Failed to update publish status:', error);
      setMessage({ type: 'error', text: 'Failed to update publish status' });
    } finally {
      setLoading(false);
    }
  };

  const deleteContestResult = async (contest) => {
    const confirmed = window.confirm(
      `Delete "${contest.title}" and all of its results? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setLoading(true);
      await adminFetch(`/api/admin/elections/${contest.id}`, {
        method: 'DELETE'
      });

      if (selectedContest?.id === contest.id) {
        setSelectedContest(null);
      }
      if (compareContest1?.id === contest.id) {
        setCompareContest1(null);
      }
      if (compareContest2?.id === contest.id) {
        setCompareContest2(null);
      }

      setMessage({ type: 'success', text: `${contest.title} deleted successfully` });
      await loadContests();
    } catch (error) {
      console.error('Failed to delete contest result:', error);
      setMessage({ type: 'error', text: 'Failed to delete contest result' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    loadContests();
  }, [user, navigate, loadContests]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredContests(contests);
      return;
    }
    const filtered = contests.filter(c =>
      c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContests(filtered);
  }, [searchTerm, contests]);

  const toggleExpanded = (contestId) => {
    setExpandedContests(prev => ({
      ...prev,
      [contestId]: !prev[contestId]
    }));
  };

  const renderChart = (candidateData) => {
    if (!candidateData || candidateData.length === 0) return null;

    if (chartType === 'bar') {
      return (
        <div style={{ marginTop: '15px' }}>
          {candidateData.map((candidate, idx) => {
            const percentage = parseFloat(candidate.percentage || 0);
            return (
              <div key={candidate.id} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: '600', color: '#333', fontSize: '0.95rem' }}>{candidate.name}</span>
                  <span style={{ color: '#667eea', fontWeight: 'bold', fontSize: '0.9rem' }}>{percentage.toFixed(1)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '24px',
                  background: '#f0f0f0',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #e2e8f3'
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: '100%',
                    background: idx === 0 ? 'linear-gradient(135deg, #FFD700 0%, #FFC700 100%)' : 
                                idx === 1 ? 'linear-gradient(135deg, #667eea 0%, #5a5fd8 100%)' :
                                'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                    transition: 'width 0.5s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.8rem'
                  }}>
                    {candidate.votes} votes
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Pie Chart - simplified
      let currentAngle = 0;
      const colors = ['#FFD700', '#667eea', '#51cf66', '#ff6b6b', '#ffa500', '#20c997', '#fd7e14'];
      return (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '15px', flexWrap: 'wrap' }}>
          <svg width="180" height="180" viewBox="0 0 180 180" style={{ flexShrink: 0 }}>
            {candidateData.map((candidate, idx) => {
              const percentage = parseFloat(candidate.percentage || 0);
              const angle = (percentage / 100) * 360;
              const startAngle = currentAngle;
              currentAngle += angle;

              const x1 = 90 + 70 * Math.cos((startAngle - 90) * Math.PI / 180);
              const y1 = 90 + 70 * Math.sin((startAngle - 90) * Math.PI / 180);
              const x2 = 90 + 70 * Math.cos((startAngle + angle - 90) * Math.PI / 180);
              const y2 = 90 + 70 * Math.sin((startAngle + angle - 90) * Math.PI / 180);

              const largeArc = angle > 180 ? 1 : 0;
              const path = `M 90 90 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;

              return (
                <path
                  key={candidate.id}
                  d={path}
                  fill={colors[idx % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {candidateData.map((candidate, idx) => (
              <div key={candidate.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.85rem'
              }}>
                <div style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  background: colors[idx % colors.length]
                }} />
                <span style={{ fontWeight: '600' }}>{candidate.name}: {(parseFloat(candidate.percentage || 0)).toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const getContestSummary = (contest) => {
    if (!contest) {
      return {
        totalVotes: 0,
        candidateCount: 0,
        topName: 'N/A',
        topVotes: 0,
        margin: 0,
        marginLabel: 'no-data'
      };
    }

    const candidates = Array.isArray(contest.candidates) ? contest.candidates : [];
    const sorted = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
    const winner = sorted[0] || null;
    const runnerUp = sorted[1] || null;

    return {
      totalVotes: contest.totalVotes || 0,
      candidateCount: candidates.length,
      topName: winner?.name || 'N/A',
      topVotes: winner?.votes || 0,
      margin: Math.max(0, (winner?.votes || 0) - (runnerUp?.votes || 0)),
      marginLabel: winner ? (runnerUp ? 'winner vs runner-up' : 'single candidate') : 'no-data'
    };
  };

  const getPublishLabel = (contest) => (contest?.resultsPublished ? 'Published' : 'Unpublished');

  if (!user || !user.isAdmin) return null;

  return (
    <div style={{ width: '100%' }}>
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
        Results & Analytics
      </h1>

      {message.text && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '12px',
          marginBottom: '25px',
          background: message.type === 'success' ? '#51cf66' : '#ff6b6b',
          border: '1px solid rgba(255,255,255,0.45)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {message.text}
        </div>
      )}

      {/* View Mode Toggle */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '15px',
        border: '1px solid #e8eef7',
        boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
        marginBottom: '25px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => { setCompareMode(false); setCompareContest1(null); setCompareContest2(null); }}
          style={{
            padding: '12px 24px',
            background: !compareMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
            color: !compareMode ? 'white' : '#333',
            border: !compareMode ? '1px solid #5f6fd6' : '1px solid #dce3ef',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <FaChartBar /> Single Contest View
        </button>
        <button
          onClick={() => setCompareMode(true)}
          style={{
            padding: '12px 24px',
            background: compareMode ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
            color: compareMode ? 'white' : '#333',
            border: compareMode ? '1px solid #5f6fd6' : '1px solid #dce3ef',
            borderRadius: '10px',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <FaExchangeAlt /> Compare Contests
        </button>

        {!compareMode && (
          <div style={{
            minWidth: '240px',
            flex: '1 1 300px',
            maxWidth: '460px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid #dce3ef',
            borderRadius: '10px',
            padding: '10px 14px',
            background: '#fafcff'
          }}>
            <FaSearch style={{ color: '#7183b6' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contest by title"
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '0.96rem',
                color: '#334155'
              }}
            />
          </div>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span style={{ fontWeight: 'bold', color: '#666' }}>Chart Type:</span>
          <button
            onClick={() => setChartType('bar')}
            style={{
              padding: '10px 20px',
              background: chartType === 'bar' ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)' : '#f0f0f0',
              color: chartType === 'bar' ? 'white' : '#333',
              border: chartType === 'bar' ? '1px solid #39b454' : '1px solid #dce3ef',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaChartLine /> Bar
          </button>
          <button
            onClick={() => setChartType('pie')}
            style={{
              padding: '10px 20px',
              background: chartType === 'pie' ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)' : '#f0f0f0',
              color: chartType === 'pie' ? 'white' : '#333',
              border: chartType === 'pie' ? '1px solid #39b454' : '1px solid #dce3ef',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FaChartPie /> Pie
          </button>
        </div>
      </div>

      {!compareMode ? (
        <>
          {/* Contest Overview Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {filteredContests.map(contest => (
              <div
                key={contest.id}
                onClick={() => setSelectedContest(contest)}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '15px',
                  boxShadow: selectedContest?.id === contest.id ? '0 8px 25px rgba(102, 126, 234, 0.3)' : '0 5px 15px rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  border: selectedContest?.id === contest.id ? '2px solid #667eea' : '1px solid #e6edf7',
                  transition: 'all 0.3s'
                }}
              >
                <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '1.2rem' }}>{contest.title}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.95rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Status:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: contest.status === 'active' ? '#51cf66' : contest.status === 'closed' ? '#ff6b6b' : '#ffa500'
                    }}>
                      {(contest.status || 'unknown').toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Total Votes:</span>
                    <span style={{ fontWeight: 'bold', color: '#667eea' }}>{contest.totalVotes || 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Candidates:</span>
                    <span style={{ fontWeight: 'bold', color: '#667eea' }}>{Array.isArray(contest.candidates) ? contest.candidates.length : 0}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#666' }}>Results:</span>
                    <span style={{
                      fontWeight: 'bold',
                      color: contest.resultsPublished ? '#51cf66' : '#ff6b6b'
                    }}>
                      {getPublishLabel(contest)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updatePublishStatus(contest, !contest.resultsPublished);
                    }}
                    disabled={loading}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #dce3ef',
                      background: contest.resultsPublished ? '#fff5f5' : '#f0fdf4',
                      color: contest.resultsPublished ? '#b91c1c' : '#166534',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {contest.resultsPublished ? <FaLock /> : <FaUnlock />}
                    {contest.resultsPublished ? 'Unpublish Results' : 'Publish Results'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteContestResult(contest);
                    }}
                    disabled={loading}
                    style={{
                      marginTop: '10px',
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: '1px solid #f3c2c2',
                      background: '#fff5f5',
                      color: '#b91c1c',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaTrash />
                    Remove Result
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Contest Details */}
          {selectedContest && (
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '20px',
              border: '1px solid #e8eef7',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '1px solid #edf2fa',
                flexWrap: 'wrap',
                gap: '15px'
              }}>
                <h2 style={{ margin: 0, color: '#333' }}>{selectedContest.title}</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    padding: '10px 20px',
                    background: selectedContest.status === 'active' ? '#51cf66' : '#ffa500',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {selectedContest.status?.toUpperCase() || 'UNKNOWN'}
                  </div>
                  <div style={{
                    padding: '10px 20px',
                    background: selectedContest.resultsPublished ? '#51cf66' : '#ff6b6b',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    {selectedContest.resultsPublished ? <FaUnlock /> : <FaLock />}
                    {selectedContest.resultsPublished ? 'Published' : 'Unpublished'}
                  </div>
                  <button
                    type="button"
                    onClick={() => updatePublishStatus(selectedContest, !selectedContest.resultsPublished)}
                    disabled={loading}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: '1px solid #dce3ef',
                      background: selectedContest.resultsPublished ? '#fff5f5' : '#f0fdf4',
                      color: selectedContest.resultsPublished ? '#b91c1c' : '#166534',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    {selectedContest.resultsPublished ? <FaLock /> : <FaUnlock />}
                    {selectedContest.resultsPublished ? 'Unpublish' : 'Publish'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteContestResult(selectedContest)}
                    disabled={loading}
                    style={{
                      padding: '10px 18px',
                      borderRadius: '10px',
                      border: '1px solid #f3c2c2',
                      background: '#fff5f5',
                      color: '#b91c1c',
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaTrash />
                    Remove
                  </button>
                </div>
              </div>

              {/* Chart */}
              {renderChart(results, selectedContest)}

              {/* Contestant Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '20px',
                marginTop: '30px'
              }}>
                {results.map((result, idx) => {
                  const hasVotes = (results[0]?.votes || 0) > 0;
                  return (
                  <div
                    key={result.id}
                    style={{
                      background: '#f8f9fa',
                      padding: '20px',
                      borderRadius: '15px',
                      border: hasVotes
                        ? idx === 0
                          ? '2px solid #2f6bff'
                          : idx === 1
                            ? '2px solid #ff4d5a'
                            : '2px solid #2f6bff'
                        : '2px solid #2f6bff',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55)',
                      position: 'relative',
                      backgroundImage: hasVotes
                        ? idx === 0
                          ? 'linear-gradient(180deg, #f2f7ff 0%, #f8f9fa 100%)'
                          : idx === 1
                            ? 'linear-gradient(180deg, #fff4f6 0%, #f8f9fa 100%)'
                            : 'none'
                        : 'none'
                    }}
                  >
                    {hasVotes && (idx === 0 || idx === 1) && (
                      <div style={{
                        position: 'absolute',
                        top: '-11px',
                        right: '12px',
                        background: idx === 0 ? '#2f6bff' : '#ff4d5a',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        letterSpacing: '0.2px'
                      }}>
                        {idx === 0 ? 'Leading' : 'Runner-up'}
                      </div>
                    )}

                    <h4 style={{ margin: '0 0 14px 0', color: '#1d4fd7', fontSize: '1.05rem', fontWeight: '800' }}>{result.name}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.95rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Votes:</span>
                        <span style={{ fontWeight: 'bold', color: hasVotes ? (idx === 0 ? '#2f6bff' : idx === 1 ? '#ff4d5a' : '#667eea') : '#667eea' }}>{result.votes}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Percentage:</span>
                        <span style={{ fontWeight: 'bold', color: hasVotes ? (idx === 0 ? '#2f6bff' : idx === 1 ? '#ff4d5a' : '#51cf66') : '#51cf66' }}>{result.percentage}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#666' }}>Party:</span>
                        <span style={{ fontWeight: 'bold' }}>{result.party || 'Independent'}</span>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : (
        // Compare Mode
        <div>
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            border: '1px solid #e8eef7',
            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
            marginBottom: '25px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>Select Contests to Compare</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#666' }}>
                  Contest 1
                </label>
                <select
                  value={compareContest1?.id || ''}
                  onChange={(e) => {
                    const contest = contests.find(c => String(c.id) === String(e.target.value));
                    setCompareContest1(contest);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #dce3ef',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select Contest 1</option>
                  {contests.map(c => (
                    <option key={c.id} value={c.id} disabled={String(c.id) === String(compareContest2?.id)}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#666' }}>
                  Contest 2
                </label>
                <select
                  value={compareContest2?.id || ''}
                  onChange={(e) => {
                    const contest = contests.find(c => String(c.id) === String(e.target.value));
                    setCompareContest2(contest);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid #dce3ef',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select Contest 2</option>
                  {contests.map(c => (
                    <option key={c.id} value={c.id} disabled={String(c.id) === String(compareContest1?.id)}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {compareContest1 && compareContest2 && (
            <>
            <div style={{
              background: 'white',
              border: '1px solid #e7edf9',
              borderRadius: '15px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.07)'
            }}>
              <h4 style={{ margin: '0 0 14px 0', color: '#2c3d78' }}>Contest Comparison Summary</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px'
              }}>
                {[compareContest1, compareContest2].map((contest, idx) => {
                  const summary = getContestSummary(contest);
                  return (
                    <div key={`${contest.id}-${idx}`} style={{
                      padding: '14px',
                      borderRadius: '12px',
                      border: '1px solid #dce5fb',
                      background: idx === 0
                        ? 'linear-gradient(180deg, #f3f7ff 0%, #f9fbff 100%)'
                        : 'linear-gradient(180deg, #fff4f6 0%, #fffbfc 100%)'
                    }}>
                      <div style={{ fontWeight: '700', color: '#334155', marginBottom: '10px' }}>{contest.title}</div>
                      <div style={{ color: '#4f5f7e', marginBottom: '5px' }}>Total Votes: <strong>{summary.totalVotes}</strong></div>
                      <div style={{ color: '#4f5f7e', marginBottom: '5px' }}>Candidates: <strong>{summary.candidateCount}</strong></div>
                      <div style={{ color: '#4f5f7e', marginBottom: '5px' }}>Leader: <strong>{summary.topName}</strong></div>
                      <div style={{ color: '#4f5f7e', marginBottom: '5px' }}>Leader Votes: <strong>{summary.topVotes}</strong></div>
                      <div style={{ color: '#4f5f7e' }}>Margin: <strong>{summary.margin}</strong> ({summary.marginLabel})</div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
              {[compareContest1, compareContest2].map((contest, idx) => {
                if (!contest) return null;
                
                const candidates = Array.isArray(contest.candidates) ? contest.candidates : [];
                const totalVotes = contest.totalVotes || 0;
                const resultsWithPercentage = candidates.map(candidate => ({
                  id: candidate.id,
                  name: candidate.name,
                  votes: candidate.votes || 0,
                  percentage: totalVotes > 0 ? ((candidate.votes || 0) / totalVotes * 100).toFixed(2) : 0
                })).sort((a, b) => (b.votes || 0) - (a.votes || 0));

                return (
                  <div
                    key={contest?.id || idx}
                    style={{
                      background: 'white',
                      padding: '25px',
                      borderRadius: '15px',
                      border: '1px solid #e8eef7',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.08)'
                    }}
                  >
                    <h3 style={{
                      margin: '0 0 20px 0',
                      color: '#333',
                      paddingBottom: '15px',
                      borderBottom: '3px solid #667eea'
                    }}>
                      {contest.title}
                    </h3>

                    <div style={{ marginBottom: '20px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '15px',
                        background: 'linear-gradient(180deg, #eef4ff 0%, #e8f0ff 100%)',
                        borderRadius: '10px',
                        border: '1px solid #cfdcff',
                        marginBottom: '10px'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#4560b4' }}>Total Votes:</span>
                        <span style={{ fontWeight: 'bold', color: '#667eea', fontSize: '1.2rem' }}>{totalVotes}</span>
                      </div>
                    </div>

                    {renderChart(resultsWithPercentage, contest)}
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminResults;
