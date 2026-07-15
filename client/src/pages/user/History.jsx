import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getVotes, getContestById, getContestantById, getContestResults, getImpactForVote, isContestResultsPublished } from '../../utils/storage';
import { FaHistory, FaTrophy, FaUser, FaCalendarAlt, FaCheckCircle, FaArrowLeft, FaChartBar, FaTv, FaVoteYea } from 'react-icons/fa';

const History = () => {
  const { user, initialized } = useApp();
  const navigate = useNavigate();
  const [votingHistory, setVotingHistory] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [contestResults, setContestResults] = useState(null);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }
    
    loadVotingHistory();
  }, [initialized, user, navigate]);

  const loadVotingHistory = () => {
    if (!user) return;
    
    const votes = getVotes();
    const userVotes = votes.filter(v => String(v.userId) === String(user.id));
    
    const history = userVotes.map(vote => {
      const contest = getContestById(vote.contestId);
      const contestant = getContestantById(vote.contestantId);
      const impact = isContestResultsPublished(vote.contestId) ? getImpactForVote(vote) : null;
      return {
        ...vote,
        contest: contest,
        contestant: contestant,
        impact
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    setVotingHistory(history);
  };

  const handleViewResults = (contestId) => {
    const contest = getContestById(contestId);
    if (contest) {
      setSelectedContest(contest);
      const results = getContestResults(contestId);
      setContestResults(results);
    }
  };

  if (!user) {
    return null;
  }

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
              <FaHistory />
            </div>
            Vote History
          </h1>
          <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>
            View your past votes and contest participation
          </p>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          minHeight: '400px'
        }}>
          {votingHistory.length === 0 ? (
            <div style={{
              padding: '80px 20px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
              borderRadius: '16px',
              border: '2px dashed rgba(102, 126, 234, 0.2)'
            }}>
              <FaHistory style={{ fontSize: '5rem', color: '#ccc', marginBottom: '20px' }} />
              <h3 style={{ marginBottom: '10px', color: '#666', fontSize: '1.5rem' }}>No Voting History</h3>
              <p style={{ color: '#999', marginBottom: '30px', fontSize: '1rem' }}>
                You haven't participated in any contests yet
              </p>
              <Link
                to="/user/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px 35px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                }}
              >
                <FaVoteYea /> Start Voting Now
              </Link>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '15px',
                marginBottom: '30px'
              }}>
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  textAlign: 'center'
                }}>
                  <FaVoteYea style={{ fontSize: '2rem', color: '#667eea', marginBottom: '8px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                    {votingHistory.length}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>Total Votes</div>
                </div>
                
                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(81, 207, 102, 0.1) 0%, rgba(64, 192, 87, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '2px solid rgba(81, 207, 102, 0.3)',
                  textAlign: 'center'
                }}>
                  <FaTv style={{ fontSize: '2rem', color: '#51cf66', marginBottom: '8px' }} />
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>
                    {new Set(votingHistory.map(v => v.contestId)).size}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '600' }}>Contests Joined</div>
                </div>
              </div>

              {/* Voting History List */}
              <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#333', fontWeight: '700' }}>
                Your Voting Timeline
              </h3>
              
              <div style={{ display: 'grid', gap: '12px' }}>
                {votingHistory.map((vote, index) => (
                  <div
                    key={vote.id || index}
                    style={{
                      padding: '18px',
                      background: 'white',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '20px',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.2)';
                      e.currentTarget.style.borderColor = '#667eea';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e0e0e0';
                    }}
                  >
                    {/* Decorative stripe */}
                    <div style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '5px',
                      background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)'
                    }}></div>

                    <div style={{ flex: 1, paddingLeft: '15px' }}>
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '5px 12px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                        borderRadius: '20px',
                        marginBottom: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        color: '#667eea'
                      }}>
                        <FaTv /> {vote.contest?.title || 'Contest'}
                      </div>
                      
                      <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: '#333',
                        marginBottom: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <FaUser style={{ color: '#667eea' }} />
                        Voted for: <span style={{ color: '#667eea' }}>{vote.contestant?.name || 'Contestant'}</span>
                      </div>
                      
                      <div style={{
                        fontSize: '0.9rem',
                        color: '#999',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <FaCalendarAlt />
                        {new Date(vote.timestamp).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      {vote.confidenceScore !== null && vote.confidenceScore !== undefined && (
                        <div style={{ marginTop: '6px', color: '#4a5568', fontWeight: '600' }}>
                          Confidence: {vote.confidenceScore}/5
                        </div>
                      )}
                      {vote.impact && vote.impact.contributionPercent !== null && (
                        <div style={{ marginTop: '6px', color: '#2d3748', fontWeight: '600' }}>
                          Impact: Your vote contributed {vote.impact.contributionPercent.toFixed(2)}% to the winning margin
                          {vote.impact.classification && ` · Contest was ${vote.impact.classification}`}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                      <div style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 12px rgba(81, 207, 102, 0.3)'
                      }}>
                        <FaCheckCircle /> Confirmed
                      </div>
                      
                      <button
                        onClick={() => handleViewResults(vote.contestId)}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          color: '#667eea',
                          border: '2px solid #667eea',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#667eea';
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                          e.currentTarget.style.color = '#667eea';
                        }}
                      >
                        <FaChartBar /> View Results
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Results Modal */}
              {selectedContest && contestResults && (
                <div
                  onClick={() => setSelectedContest(null)}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                  }}
                >
                  <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'white',
                      borderRadius: '20px',
                      padding: '30px',
                      maxWidth: '600px',
                      width: '100%',
                      maxHeight: '80vh',
                      overflow: 'auto'
                    }}
                  >
                    <h3 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#333' }}>
                      <FaTrophy style={{ color: '#ffd700', marginRight: '10px' }} />
                      {selectedContest.title} - Results
                    </h3>
                    
                    {contestResults.map((result, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '15px',
                          background: index === 0 ? 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)' : '#f5f5f5',
                          borderRadius: '12px',
                          marginBottom: '10px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                          <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: index === 0 ? 'white' : '#666'
                          }}>
                            #{index + 1}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: index === 0 ? 'white' : '#333' }}>
                              {result.contestantName}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: index === 0 ? 'rgba(255,255,255,0.9)' : '#666' }}>
                              {result.votes} votes
                            </div>
                          </div>
                        </div>
                        {index === 0 && <FaTrophy style={{ fontSize: '2rem', color: 'white' }} />}
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setSelectedContest(null)}
                      style={{
                        marginTop: '20px',
                        padding: '12px 30px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        width: '100%'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default History;
