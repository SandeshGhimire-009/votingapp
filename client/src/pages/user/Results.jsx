import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import { awardBadge } from '../../utils/storage';
import { FaChartBar, FaChartLine, FaChartPie, FaTrophy, FaUsers, FaFire, FaSync, FaSearch, FaCheckCircle } from 'react-icons/fa';

const Results = () => {
  const navigate = useNavigate();
  const { user, initialized, contests: appContests, refreshData } = useApp();
  const [contests, setContests] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [chartType, setChartType] = useState('bar');
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const refreshDataRef = useRef(refreshData);

  useEffect(() => {
    refreshDataRef.current = refreshData;
  }, [refreshData]);

  const loadResults = useCallback(async ({ showLoading = false, syncContext = false } = {}) => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    if (showLoading) {
      setLoading(true);
    }

    try {
      const elections = await adminFetch('/api/elections');
      const source = Array.isArray(elections) && elections.length > 0 ? elections : appContests;
      const normalized = (Array.isArray(source) ? source : []).map((contest) => {
        const candidates = Array.isArray(contest.candidates) ? [...contest.candidates] : [];
        const totalVotes = contest.totalVotes ?? candidates.reduce((sum, candidate) => sum + (candidate.votes || 0), 0);
        const sortedCandidates = candidates.sort((a, b) => (b.votes || 0) - (a.votes || 0));
        return {
          ...contest,
          totalVotes,
          candidates: sortedCandidates.map((candidate) => ({
            ...candidate,
            percentage: totalVotes > 0 ? ((candidate.votes || 0) / totalVotes) * 100 : 0,
          })),
          resultsPublished: contest.resultsPublished === true,
        };
      }).filter((contest) => contest.resultsPublished);

      setContests(normalized);
      if (syncContext) {
        refreshDataRef.current();
      }
    } catch (error) {
      console.error('Failed to load results:', error);
      setContests(appContests.filter((contest) => contest.resultsPublished));
    } finally {
      isFetchingRef.current = false;
      if (showLoading) {
        setLoading(false);
      }
    }
  }, [appContests]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    loadResults({ showLoading: false, syncContext: true });
    const refreshInterval = setInterval(() => {
      loadResults({ showLoading: false, syncContext: false });
    }, 3000);
    const handleDataUpdate = () => loadResults({ showLoading: false, syncContext: false });
    window.addEventListener('reality-voting-data-updated', handleDataUpdate);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('reality-voting-data-updated', handleDataUpdate);
    };
  }, [initialized, user, navigate, loadResults]);

  useEffect(() => {
    if (user && contests.length > 0) {
      awardBadge(user.id, 'results_viewed', { contestId: contests[0].id });
    }
  }, [user, contests]);

  const toggleExpanded = (contestId) => {
    setExpanded((prev) => ({ ...prev, [contestId]: !prev[contestId] }));
  };

  const filteredContests = useMemo(() => {
    if (!searchTerm.trim()) return contests;
    const term = searchTerm.toLowerCase();
    return contests.filter((contest) => contest.title?.toLowerCase().includes(term));
  }, [contests, searchTerm]);

  const renderChart = (candidateData) => {
    if (!candidateData?.length) return null;

    if (chartType === 'bar') {
      return (
        <div style={{ marginTop: '16px' }}>
          {candidateData.map((candidate, idx) => (
            <div key={candidate.id} style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600, color: '#334155' }}>{candidate.name}</span>
                <span style={{ color: '#667eea', fontWeight: 700 }}>{candidate.percentage.toFixed(1)}%</span>
              </div>
              <div style={{ height: '20px', borderRadius: '999px', overflow: 'hidden', background: '#eef2ff' }}>
                <div style={{
                  width: `${candidate.percentage}%`,
                  height: '100%',
                  background: idx === 0 ? 'linear-gradient(135deg, #facc15 0%, #f59e0b 100%)' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          ))}
        </div>
      );
    }

    let angle = 0;
    const colors = ['#facc15', '#667eea', '#51cf66', '#ff6b6b', '#20c997'];
    return (
      <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap', alignItems: 'center', marginTop: '16px' }}>
        <svg width="150" height="150" viewBox="0 0 150 150">
          {candidateData.map((candidate, idx) => {
            const slice = (candidate.percentage / 100) * 360;
            const start = angle;
            angle += slice;
            const x1 = 75 + 55 * Math.cos((start - 90) * Math.PI / 180);
            const y1 = 75 + 55 * Math.sin((start - 90) * Math.PI / 180);
            const x2 = 75 + 55 * Math.cos((start + slice - 90) * Math.PI / 180);
            const y2 = 75 + 55 * Math.sin((start + slice - 90) * Math.PI / 180);
            const largeArc = slice > 180 ? 1 : 0;
            return (
              <path
                key={candidate.id}
                d={`M 75 75 L ${x1} ${y1} A 55 55 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={colors[idx % colors.length]}
                stroke="#fff"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {candidateData.slice(0, 5).map((candidate, idx) => (
            <div key={candidate.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: colors[idx % colors.length] }} />
              <span style={{ fontWeight: 600 }}>{candidate.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        marginBottom: '30px',
        background: 'linear-gradient(87deg, #11cdef 0, #1171ef 100%)',
        padding: '40px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '15px' }}>
          <FaChartBar /> Election Results
        </h1>
        <p style={{ margin: '10px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
          View all published results and winners
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '14px',
        flexWrap: 'wrap',
        marginBottom: '22px',
        alignItems: 'center',
        background: 'white',
        padding: '18px',
        borderRadius: '14px',
        boxShadow: '0 7px 14px rgba(50, 50, 93, 0.08)'
      }}>
        <div style={{ flex: '1 1 280px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #dbe2f1', borderRadius: '12px', padding: '10px 14px', background: '#fbfdff' }}>
          <FaSearch style={{ color: '#7183b6' }} />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search contests..."
            style={{ border: 'none', outline: 'none', width: '100%', background: 'transparent', fontSize: '0.96rem' }}
          />
        </div>
        <button onClick={() => setChartType('bar')} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: chartType === 'bar' ? '#51cf66' : '#f1f5f9', color: chartType === 'bar' ? 'white' : '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaChartLine /> Bar
        </button>
        <button onClick={() => setChartType('pie')} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: chartType === 'pie' ? '#51cf66' : '#f1f5f9', color: chartType === 'pie' ? 'white' : '#334155', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FaChartPie /> Pie
        </button>
        <button onClick={() => loadResults({ showLoading: true, syncContext: true })} disabled={loading} style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#667eea', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
          <FaSync style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
        </button>
      </div>

      {filteredContests.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)'
        }}>
          <FaChartBar style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }} />
          <h3 style={{ color: '#666', marginBottom: '10px' }}>No Results Published Yet</h3>
          <p style={{ color: '#999' }}>Results will appear here when the admin publishes them.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {filteredContests.map((contest) => {
            const isOpen = expanded[contest.id];
            const candidates = Array.isArray(contest.candidates) ? contest.candidates : [];
            const sorted = [...candidates].sort((a, b) => (b.votes || 0) - (a.votes || 0));
            const winner = sorted[0] || null;

            return (
              <div key={contest.id} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: isOpen ? '0 16px 40px rgba(17, 113, 239, 0.18)' : '0 7px 14px rgba(50, 50, 93, 0.1)', border: '1px solid #dbe2f1' }}>
                <div onClick={() => toggleExpanded(contest.id)} style={{ padding: '18px 20px', cursor: 'pointer', background: 'linear-gradient(135deg, #f8fbff 0%, #eef4ff 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {winner ? <FaTrophy style={{ color: '#facc15' }} /> : <FaFire style={{ color: '#ef4444' }} />} {contest.title}
                    </h3>
                    <div style={{ fontSize: '0.88rem', color: '#5a678f', marginTop: '6px', display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaUsers /> {sorted.length} candidates</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaCheckCircle /> {contest.totalVotes || 0} votes</span>
                    </div>
                  </div>
                  <div style={{ padding: '8px 12px', borderRadius: '999px', background: '#e0f2fe', color: '#075985', fontWeight: 700, fontSize: '0.75rem' }}>
                    {(contest.status || 'published').toUpperCase()}
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '20px' }}>
                    {winner && (
                      <div style={{ marginBottom: '18px', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #fff7d6 0%, #fffdf0 100%)', border: '1px solid #f6d365' }}>
                        <div style={{ fontWeight: 800, color: '#92400e', marginBottom: '6px' }}>Winner</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>{winner.name}</div>
                        <div style={{ color: '#6b7280', marginTop: '4px' }}>{winner.votes || 0} votes</div>
                      </div>
                    )}

                    {renderChart(sorted.map((candidate) => ({
                      ...candidate,
                      percentage: contest.totalVotes > 0 ? ((candidate.votes || 0) / contest.totalVotes) * 100 : 0,
                    })))}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginTop: '18px' }}>
                      {sorted.map((candidate, idx) => (
                        <div key={candidate.id} style={{ padding: '14px', borderRadius: '12px', background: idx === 0 ? 'linear-gradient(135deg, #fff8e1 0%, #fffdf5 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: idx === 0 ? '2px solid #facc15' : '1px solid #e2e8f0', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: '#111827' }}>{candidate.name}</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#667eea', marginTop: '8px' }}>{candidate.votes || 0}</div>
                          <div style={{ color: '#6b7280', fontSize: '0.85rem' }}>{((candidate.percentage || 0)).toFixed(1)}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Results;
