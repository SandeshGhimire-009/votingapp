import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import {
  addActivityLog, addNotification
} from '../../utils/storage';
import {
  FaTv, FaPlus, FaEdit, FaTrash, FaPlay, FaStop, FaUsers, FaCalendarAlt,
  FaCheckCircle, FaTimesCircle, FaImage, FaUpload, FaSearch, FaExclamationTriangle
} from 'react-icons/fa';

const AdminContests = () => {
  const { user, refreshData } = useApp();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const [contests, setContests] = useState([]);
  const [filteredContests, setFilteredContests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContestModal, setShowContestModal] = useState(false);
  const [showContestantModal, setShowContestantModal] = useState(false);
  const [selectedContest, setSelectedContest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);

  const [contestForm, setContestForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'draft'
  });

  const [contestantForm, setContestantForm] = useState({
    name: '',
    description: '',
    image: null
  });
  const [contestantImagePreview, setContestantImagePreview] = useState(null);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    loadContests();
  }, [user, navigate]);

  useEffect(() => {
    filterContests();
  }, [searchTerm, contests]);

  const loadContests = async () => {
    try {
      const allContests = await adminFetch('/api/elections');
      const normalized = Array.isArray(allContests)
        ? allContests.map((contest) => ({
            ...contest,
            votingEnabled: contest.status === 'active'
          }))
        : [];
      setContests(normalized);
      setFilteredContests(normalized);
      refreshData();
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load contests from database.' });
    }
  };

  const filterContests = () => {
    if (!searchTerm.trim()) {
      setFilteredContests(contests);
      return;
    }
    const filtered = contests.filter(c =>
      c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContests(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const totalPages = Math.ceil(filteredContests.length / itemsPerPage);
  const pagesPerChunk = 4;
  const chunkStart = Math.floor((currentPage - 1) / pagesPerChunk) * pagesPerChunk + 1;
  const chunkEnd = Math.min(totalPages, chunkStart + pagesPerChunk - 1);
  const visiblePages = Array.from({ length: Math.max(0, chunkEnd - chunkStart + 1) }, (_, i) => chunkStart + i);
  const hasPreviousChunk = chunkStart > 1;
  const hasNextChunk = chunkEnd < totalPages;
  const currentItems = filteredContests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleContestInputChange = (e) => {
    const { name, value } = e.target;
    setContestForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContestantInputChange = (e) => {
    const { name, value } = e.target;
    setContestantForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContestantImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setContestantImagePreview(reader.result);
        setContestantForm(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const start = new Date(contestForm.startDate || new Date().toISOString());
      const end = new Date(contestForm.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());

      if (end <= start) {
        setMessage({ type: 'error', text: 'End date must be after start date' });
        setLoading(false);
        return;
      }

      if (start < new Date()) {
        // Optional: Warn about past start date, or prevent it. 
        // For now, let's just allow it but maybe logic should prevent it?
        // Let's prevent it if it's too far in the past, but "now" is fine.
      }

      const newContest = await adminFetch('/api/admin/elections', {
        method: 'POST',
        body: JSON.stringify({
        title: contestForm.title.trim(),
        description: contestForm.description.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        status: contestForm.status
      })
      });

      addActivityLog({
        type: 'contest_created',
        userId: user.id,
        contestId: newContest.id,
        action: `Contest "${newContest.title}" created`
      });

      // Notify all users about new contest
      addNotification({
        userId: 'all',
        type: 'contest_created',
        title: `New Contest: ${newContest.title}`,
        message: newContest.description || 'A new contest has been created. Tap to view and get ready!',
        link: '/user/vote'
      });

      await loadContests();
      setShowContestModal(false);
      setContestForm({ title: '', description: '', startDate: '', endDate: '', status: 'draft' });
      setMessage({ type: 'success', text: 'Contest created successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create contest. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContestant = async (e) => {
    e.preventDefault();
    if (!selectedContest) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await adminFetch('/api/admin/candidates', {
        method: 'POST',
        body: JSON.stringify({
        electionId: selectedContest.id,
        name: contestantForm.name.trim(),
        position: 'Contestant',
        bio: contestantForm.description.trim(),
        image: contestantForm.image
      })
      });

      await loadContests();
      setShowContestantModal(false);
      setContestantForm({ name: '', description: '', image: null });
      setContestantImagePreview(null);
      setMessage({ type: 'success', text: 'Contestant added successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to add contestant. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVoting = async (contestId) => {
    try {
      const contest = contests.find(c => String(c.id) === String(contestId));
      if (!contest) return;

      // Re-check against latest backend state to avoid stale UI data.
      const latestContest = await adminFetch(`/api/elections/${contestId}`);
      const contestantsCount = Array.isArray(latestContest?.candidates) ? latestContest.candidates.length : 0;
      const isCurrentlyActive = latestContest?.status === 'active';

      if (!isCurrentlyActive && contestantsCount < 2) {
        setMessage({
          type: 'error',
          text: `Need at least 2 contestants in MongoDB for this contest. Current: ${contestantsCount}`
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        return;
      }

      const newVotingEnabled = !isCurrentlyActive;
      await adminFetch(`/api/admin/elections/${contestId}`, {
        method: 'PATCH',
        body: JSON.stringify({
        status: newVotingEnabled ? 'active' : 'draft'
        })
      });

      addActivityLog({
        type: 'contest_updated',
        userId: user.id,
        contestId: contestId,
        action: `Voting ${newVotingEnabled ? 'started' : 'stopped'} for contest "${contest.title}"`
      });

      addNotification({
        userId: 'all',
        type: newVotingEnabled ? 'voting_opened' : 'voting_closed',
        title: `${contest.title}: Voting ${newVotingEnabled ? 'Opened' : 'Closed'}`,
        message: newVotingEnabled ? 'Voting is now open. Cast your vote!' : 'Voting has closed for this contest.',
        link: '/user/vote'
      });

      await loadContests();
      setMessage({ type: 'success', text: `Voting ${newVotingEnabled ? 'started' : 'stopped'} successfully!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to update contest status' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleDeleteContest = async (contestId) => {
    const contest = contests.find(c => c.id === contestId);
    if (!contest) return;

    if (window.confirm(`Are you sure you want to delete "${contest.title}"? This will also delete all contestants and votes for this contest.`)) {
      await adminFetch(`/api/admin/elections/${contestId}`, {
        method: 'DELETE'
      });
      addActivityLog({
        type: 'contest_deleted',
        userId: user.id,
        contestId: contestId,
        action: `Contest "${contest.title}" deleted`
      });
      await loadContests();
      setMessage({ type: 'success', text: 'Contest deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
        <h1 style={{
          fontSize: '2.5rem',
          margin: 0,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <FaTv /> Contest Management
        </h1>
        <button
          onClick={() => setShowContestModal(true)}
          style={{
            padding: '12px 25px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '1rem',
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
          <FaPlus /> Create Contest
        </button>
      </div>

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

      {/* Search */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ position: 'relative', maxWidth: '500px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search contests..."
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
      </div>

      {/* Contests List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '25px' }}>
        {filteredContests.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            background: 'white',
            padding: '60px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <FaTv style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }} />
            <h3 style={{ marginBottom: '10px', color: '#666' }}>No Contests</h3>
            <p style={{ color: '#999', marginBottom: '30px' }}>
              {searchTerm ? 'No contests match your search' : 'Create your first contest to get started!'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => setShowContestModal(true)}
                style={{
                  padding: '12px 30px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Create Contest
              </button>
            )}
          </div>
        ) : (
          currentItems.map(contest => {
            const contestantsCount = Array.isArray(contest.candidates) ? contest.candidates.length : 0;
            return (
              <div
                key={contest.id}
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  border: '2px solid #e0e0e0',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e0e0e0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                      {contest.title}
                    </h3>
                    <span style={{
                      padding: '5px 12px',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      background: contest.status === 'active' && contest.votingEnabled
                        ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
                        : contest.status === 'draft'
                          ? 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)'
                          : 'linear-gradient(135deg, #999 0%, #777 100%)',
                      color: 'white'
                    }}>
                      {contest.status === 'active' && contest.votingEnabled ? 'Active' : contest.status}
                    </span>
                  </div>
                  <p style={{ margin: '10px 0', color: '#666', fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {contest.description || 'No description'}
                  </p>
                </div>

                <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.9rem' }}>
                    <FaCalendarAlt style={{ color: '#667eea' }} />
                    <span><strong>Start:</strong> {new Date(contest.startDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.9rem' }}>
                    <FaCalendarAlt style={{ color: '#667eea' }} />
                    <span><strong>End:</strong> {new Date(contest.endDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.9rem' }}>
                    <FaUsers style={{ color: '#667eea' }} />
                    <span><strong>Contestants:</strong> {contestantsCount}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '0.9rem' }}>
                    <FaTv style={{ color: '#667eea' }} />
                    <span><strong>Total Votes:</strong> {contest.totalVotes || 0}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  {contestantsCount < 2 && !contest.votingEnabled && (
                    <div style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#856404',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <FaExclamationTriangle />
                      Need at least 2 contestants to start voting
                    </div>
                  )}
                  <button
                    onClick={() => handleToggleVoting(contest.id)}
                    disabled={!contest.votingEnabled && contestantsCount < 2}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: contest.votingEnabled
                        ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                        : contestantsCount < 2
                          ? '#ccc'
                          : 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: (!contest.votingEnabled && contestantsCount < 2) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease',
                      opacity: (!contest.votingEnabled && contestantsCount < 2) ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (contest.votingEnabled || contestantsCount >= 2) {
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }
                    }}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    {contest.votingEnabled ? <FaStop /> : <FaPlay />}
                    {contest.votingEnabled ? 'Stop Voting' : 'Start Voting'}
                  </button>
                  <button
                    onClick={() => navigate(`/admin/contestants?contestId=${contest.id}`)}
                    title="View Contestants"
                    style={{
                      padding: '10px',
                      background: 'linear-gradient(135deg, #11cdef 0%, #1171ef 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaUsers /> View ({contestantsCount})
                  </button>
                  <button
                    onClick={() => {
                      setSelectedContest(contest);
                      setShowContestantModal(true);
                    }}
                    style={{
                      padding: '10px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaPlus /> Add Contestant
                  </button>
                  <button
                    onClick={() => handleDeleteContest(contest.id)}
                    style={{
                      padding: '10px',
                      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })
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
                borderRadius: '50%',
                background: '#eceff4',
                border: '1px solid #d7dde8',
                color: hasPreviousChunk ? '#8a96ab' : '#c6ccd8',
                cursor: hasPreviousChunk ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '1rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
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
                  borderRadius: '50%',
                  background: currentPage === page ? '#667eea' : '#f1f3f7',
                  border: currentPage === page ? 'none' : '1px solid #d8deea',
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
                borderRadius: '50%',
                background: '#eceff4',
                border: '1px solid #d7dde8',
                color: hasNextChunk ? '#667eea' : '#c6ccd8',
                cursor: hasNextChunk ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '1rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Create Contest Modal */}
      {showContestModal && (
        <div
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
          onClick={() => {
            if (!loading) {
              setShowContestModal(false);
              setContestForm({ title: '', description: '', startDate: '', endDate: '', status: 'draft' });
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '25px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}>Create New Contest</h2>
            <form onSubmit={handleCreateContest}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contest Title *</label>
                <input
                  type="text"
                  name="title"
                  value={contestForm.title}
                  onChange={handleContestInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  name="description"
                  value={contestForm.description}
                  onChange={handleContestInputChange}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Start Date *</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={contestForm.startDate}
                    onChange={handleContestInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>End Date *</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={contestForm.endDate}
                    onChange={handleContestInputChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e0e0e0',
                      borderRadius: '10px',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowContestModal(false);
                    setContestForm({ title: '', description: '', startDate: '', endDate: '', status: 'draft' });
                  }}
                  disabled={loading}
                  style={{
                    padding: '12px 30px',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Creating...' : 'Create Contest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contestant Modal */}
      {showContestantModal && selectedContest && (
        <div
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
          onClick={() => {
            if (!loading) {
              setShowContestantModal(false);
              setSelectedContest(null);
              setContestantForm({ name: '', description: '', image: null });
              setContestantImagePreview(null);
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '25px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}>
              Add Contestant to "{selectedContest.title}"
            </h2>
            <form onSubmit={handleAddContestant}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={contestantForm.name}
                  onChange={handleContestantInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  name="description"
                  value={contestantForm.description}
                  onChange={handleContestantInputChange}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Image</label>
                {contestantImagePreview && (
                  <img
                    src={contestantImagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: '10px',
                      marginBottom: '15px',
                      border: '2px solid #e0e0e0'
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    padding: '12px 25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <FaUpload /> {contestantImagePreview ? 'Change Image' : 'Upload Image'}
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleContestantImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowContestantModal(false);
                    setSelectedContest(null);
                    setContestantForm({ name: '', description: '', image: null });
                    setContestantImagePreview(null);
                  }}
                  disabled={loading}
                  style={{
                    padding: '12px 30px',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Adding...' : 'Add Contestant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContests;
