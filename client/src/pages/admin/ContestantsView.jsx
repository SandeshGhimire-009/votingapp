import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import {
  FaUsers,
  FaArrowLeft,
  FaTrash,
  FaVoteYea,
  FaUser,
  FaSearch,
  FaExchangeAlt,
  FaTimes,
  FaEye
} from 'react-icons/fa';

const ContestantsView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useApp();
  const [contestants, setContestants] = useState([]);
  const [filteredContestants, setFilteredContestants] = useState([]);
  const [contest, setContest] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedContestants, setSelectedContestants] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);

  const contestId = searchParams.get('contestId');

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }

    if (!contestId) {
      navigate('/admin/contests');
      return;
    }

    loadData();
  }, [user, navigate, contestId]);

  useEffect(() => {
    filterContestants();
  }, [searchTerm, contestants]);

  const loadData = () => {
    const run = async () => {
      setLoading(true);
      try {
        const contestData = await adminFetch(`/api/elections/${Number(contestId)}`);
        const contestantsData = await adminFetch(`/api/elections/${Number(contestId)}/candidates`);

        setContest(contestData || null);
        setContestants(Array.isArray(contestantsData) ? contestantsData : []);
        setFilteredContestants(Array.isArray(contestantsData) ? contestantsData : []);
      } catch (error) {
        setMessage({ type: 'error', text: error?.message || 'Failed to load contestants' });
        setContest(null);
        setContestants([]);
        setFilteredContestants([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  };

  const filterContestants = () => {
    if (!searchTerm.trim()) {
      setFilteredContestants(contestants);
      return;
    }
    const filtered = contestants.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.statement?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContestants(filtered);
  };

  const handleDeleteContestant = async (contestantId, contestantName) => {
    if (window.confirm(`Are you sure you want to remove "${contestantName}" from this contest?`)) {
      try {
        await adminFetch(`/api/admin/candidates/${contestantId}`, {
          method: 'DELETE'
        });
        loadData();
        setMessage({ type: 'success', text: 'Contestant removed successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: error?.message || 'Failed to remove contestant' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    }
  };

  const handleToggleCompareMode = () => {
    setCompareMode(!compareMode);
    setSelectedContestants([]);
  };

  const handleSelectContestant = (contestant) => {
    if (selectedContestants.find(c => c.id === contestant.id)) {
      setSelectedContestants(selectedContestants.filter(c => c.id !== contestant.id));
    } else {
      setSelectedContestants([...selectedContestants, contestant]);
    }
  };

  const handleViewDetail = (contestant) => {
    setSelectedDetail(contestant);
    setShowDetailModal(true);
  };

  if (!user || !user.isAdmin) return null;

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <button
          onClick={() => navigate('/admin/contests')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#667eea',
            textDecoration: 'none',
            marginBottom: '20px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <div style={{ background: 'white', borderRadius: '10px', padding: '30px', border: '1px solid #e0e0e0' }}>
          Loading contestants...
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
        <button
          onClick={() => navigate('/admin/contests')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#667eea',
            textDecoration: 'none',
            marginBottom: '20px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <FaArrowLeft /> Back
        </button>
        <div style={{ background: '#f8d7da', color: '#721c24', borderRadius: '10px', padding: '16px', border: '1px solid #f5c6cb' }}>
          {message.text || 'Contest was not found or could not be loaded.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <button
        onClick={() => navigate('/admin/contests')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          color: '#667eea',
          textDecoration: 'none',
          marginBottom: '20px',
          fontWeight: '500',
          cursor: 'pointer',
          fontSize: '0.95rem'
        }}
      >
        <FaArrowLeft /> Back
      </button>

      {/* Header */}
      <div style={{
        marginBottom: '25px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 25px',
        borderRadius: '10px',
        color: 'white',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '1.6rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FaUsers style={{ fontSize: '1.4rem' }} /> {contest.title}
          </h1>
          <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
            {filteredContestants.length} contestant{filteredContestants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={handleToggleCompareMode}
          style={{
            padding: '10px 16px',
            background: compareMode ? '#ff5252' : 'rgba(255,255,255,0.2)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease',
            fontSize: '0.9rem'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = compareMode ? '#ff3333' : 'rgba(255,255,255,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = compareMode ? '#ff5252' : 'rgba(255,255,255,0.2)'}
        >
          <FaExchangeAlt /> {compareMode ? `Compare (${selectedContestants.length})` : 'Compare'}
        </button>
      </div>

      {message.text && (
        <div style={{
          padding: '12px 15px',
          borderRadius: '8px',
          marginBottom: '20px',
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
          fontSize: '0.9rem'
        }}>
          {message.text}
        </div>
      )}

      {/* Search Bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999',
            fontSize: '0.9rem'
          }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 38px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '0.9rem',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>
      </div>

      {filteredContestants.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '10px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e0e0e0'
        }}>
          <FaUsers style={{ fontSize: '2.5rem', color: '#ddd', marginBottom: '15px' }} />
          <h3 style={{ color: '#666', margin: '0 0 8px 0', fontSize: '1rem' }}>
            {searchTerm ? 'No contestants match' : 'No Contestants'}
          </h3>
          <p style={{ color: '#999', margin: 0, fontSize: '0.9rem' }}>
            {searchTerm ? 'Try a different search' : 'Add contestants to get started'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {filteredContestants.map(contestant => (
            <div
              key={contestant.id}
              style={{
                background: 'white',
                borderRadius: '8px',
                padding: '15px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: compareMode && selectedContestants.find(c => c.id === contestant.id) 
                  ? '2px solid #667eea' 
                  : '1px solid #e0e0e0',
                background: compareMode && selectedContestants.find(c => c.id === contestant.id)
                  ? '#f0f4ff'
                  : 'white',
                cursor: compareMode ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                gap: '12px'
              }}
              onClick={() => compareMode && handleSelectContestant(contestant)}
            >
              {compareMode && (
                <input
                  type="checkbox"
                  checked={!!selectedContestants.find(c => c.id === contestant.id)}
                  onChange={() => handleSelectContestant(contestant)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                />
              )}

              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: contestant.profilePicture 
                  ? `url(${contestant.profilePicture})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.3rem',
                fontWeight: 'bold',
                flexShrink: 0
              }}>
                {!contestant.profilePicture && (contestant.name?.charAt(0) || <FaUser />)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ 
                  margin: '0 0 3px 0', 
                  color: '#333', 
                  fontSize: '1rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetail(contestant);
                    }}
                    style={{
                      cursor: 'pointer',
                      color: '#667eea',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#764ba2';
                      e.currentTarget.style.textDecoration = 'underline';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#667eea';
                      e.currentTarget.style.textDecoration = 'none';
                    }}
                  >
                    {contestant.name}
                    <FaEye style={{ fontSize: '0.75rem' }} />
                  </span>
                </h3>
                <div style={{ color: '#999', fontSize: '0.85rem' }}>
                  {contestant.email}
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 15px',
                background: '#f0f4ff',
                borderRadius: '6px',
                border: '1px solid #667eea',
                flexShrink: 0
              }}>
                <FaVoteYea style={{ fontSize: '1rem', color: '#667eea', marginBottom: '2px' }} />
                <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#667eea' }}>
                  {contestant.votes || 0}
                </div>
              </div>

              {!compareMode && (
                <button
                  onClick={() => handleDeleteContestant(contestant.id, contestant.name)}
                  style={{
                    padding: '8px 12px',
                    background: '#ff5252',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'background 0.2s',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#ff3333'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ff5252'}
                >
                  <FaTrash style={{ fontSize: '0.8rem' }} /> Remove
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '1.4rem' }}>Contestant Details</h2>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedDetail(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '25px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: selectedDetail.profilePicture 
                  ? `url(${selectedDetail.profilePicture})` 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                margin: '0 auto 15px'
              }}>
                {!selectedDetail.profilePicture && (selectedDetail.name?.charAt(0) || <FaUser />)}
              </div>
              <h3 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '1.2rem' }}>
                {selectedDetail.name}
              </h3>
              <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                {selectedDetail.email}
              </p>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600', marginBottom: '5px' }}>
                  VOTES
                </div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: '#667eea' }}>
                  {selectedDetail.votes || 0}
                </div>
              </div>

              {selectedDetail.statement && (
                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600', marginBottom: '8px' }}>
                    STATEMENT
                  </div>
                  <p style={{ margin: 0, color: '#555', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {selectedDetail.statement}
                  </p>
                </div>
              )}

              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600', marginBottom: '5px' }}>
                  JOINED
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: '0.95rem' }}>
                  {selectedDetail.createdAt ? new Date(selectedDetail.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <div style={{ fontSize: '0.8rem', color: '#666', fontWeight: '600', marginBottom: '5px' }}>
                  CONTEST
                </div>
                <p style={{ margin: 0, color: '#555', fontSize: '0.95rem' }}>
                  {contest.title}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedDetail(null);
              }}
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '20px',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#764ba2'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {compareMode && selectedContestants.length >= 2 && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '85vh',
            overflow: 'auto',
            boxShadow: '0 15px 50px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '25px',
              borderBottom: '1px solid #e0e0e0',
              paddingBottom: '15px'
            }}>
              <h2 style={{ margin: 0, color: '#333', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaExchangeAlt /> Compare Contestants ({selectedContestants.length})
              </h2>
              <button
                onClick={() => {
                  setCompareMode(false);
                  setSelectedContestants([]);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.3rem',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fit, minmax(250px, 1fr))`,
              gap: '20px',
              marginBottom: '20px'
            }}>
              {selectedContestants
                .map((contestant, index) => ({
                  ...contestant,
                  rank: [...selectedContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0)).findIndex(c => c.id === contestant.id) + 1
                }))
                .map((contestant) => {
                  const rankBadgeColor = contestant.rank === 1 ? '#FFD700' : contestant.rank === 2 ? '#C0C0C0' : contestant.rank === 3 ? '#CD7F32' : '#667eea';
                  return (
                <div key={contestant.id} style={{
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  padding: '20px',
                  background: '#f8f9fa',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    right: '20px',
                    width: '45px',
                    height: '45px',
                    borderRadius: '50%',
                    background: rankBadgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    color: contestant.rank === 1 ? '#333' : 'white',
                    fontSize: '1.4rem',
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
                    border: '3px solid white'
                  }}>
                    {contestant.rank}
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '50%',
                      background: contestant.profilePicture 
                        ? `url(${contestant.profilePicture})` 
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      marginBottom: '12px'
                    }}>
                      {!contestant.profilePicture && (contestant.name?.charAt(0) || <FaUser />)}
                    </div>
                    <h3 style={{ margin: '0 0 3px 0', color: '#333', textAlign: 'center', fontSize: '1.1rem' }}>
                      {contestant.name}
                    </h3>
                    <p style={{ margin: 0, color: '#999', fontSize: '0.85rem', textAlign: 'center' }}>
                      {contestant.email}
                    </p>
                  </div>

                  <div style={{
                    background: 'white',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'center',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: '3px' }}>VOTES</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#667eea' }}>
                      {contestant.votes || 0}
                    </div>
                  </div>

                  {contestant.statement && (
                    <div style={{
                      background: 'white',
                      padding: '12px',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontWeight: '600', marginBottom: '5px' }}>
                        STATEMENT
                      </div>
                      <p style={{ margin: 0, color: '#555', fontSize: '0.85rem', lineHeight: '1.4' }}>
                        {contestant.statement.length > 100 
                          ? contestant.statement.substring(0, 100) + '...' 
                          : contestant.statement}
                      </p>
                    </div>
                  )}
                </div>
                  );
                })}
            </div>

            {selectedContestants.length >= 2 && (
              <div style={{
                background: '#f0f4ff',
                padding: '20px',
                borderRadius: '10px',
                border: '2px solid #667eea'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '1.1rem' }}>
                  Comparison Summary
                </h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: selectedContestants.length === 2 ? '1fr 1fr 1fr' : 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', fontWeight: '600' }}>
                      Total Votes
                    </div>
                    <div style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 'bold',
                      color: '#667eea'
                    }}>
                      {selectedContestants.reduce((sum, c) => sum + (c.votes || 0), 0)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', fontWeight: '600' }}>
                      Leading
                    </div>
                    <div style={{ 
                      fontSize: '1rem', 
                      fontWeight: 'bold',
                      color: '#667eea'
                    }}>
                      {(() => {
                        const leader = [...selectedContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
                        const leaderVotes = leader.votes || 0;
                        const secondVotes = [...selectedContestants].sort((a, b) => (b.votes || 0) - (a.votes || 0))[1]?.votes || 0;
                        if (leaderVotes === secondVotes && selectedContestants.length > 1) {
                          return 'Tied';
                        }
                        return leader.name.split(' ')[0];
                      })()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginBottom: '5px', fontWeight: '600' }}>
                      Average Votes
                    </div>
                    <div style={{ 
                      fontSize: '1.4rem', 
                      fontWeight: 'bold',
                      color: '#667eea'
                    }}>
                      {(selectedContestants.reduce((sum, c) => sum + (c.votes || 0), 0) / selectedContestants.length).toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestantsView;
