import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import {
  hasUserVotedInContest,
  getVotingWindowStatus,
  getContestantRequestsByUserId,
  addContestantRequest,
  addNotification
} from '../../utils/storage';
import { fetchElections, fetchElectionCandidates } from '../../api';
import { FaVoteYea, FaCheckCircle, FaArrowLeft, FaUserPlus, FaClock, FaExclamationTriangle, FaEye } from 'react-icons/fa';

const Vote = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, initialized, voteForContestant } = useApp();
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState(null);
  const [contestants, setContestants] = useState([]);
  const [selectedContestant, setSelectedContestant] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [voteId, setVoteId] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [windowStatus, setWindowStatus] = useState(getVotingWindowStatus());
  const [countdown, setCountdown] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [dataError, setDataError] = useState('');

  // Contestant application states
  const [userRequests, setUserRequests] = useState([]);
  const [applicationBio, setApplicationBio] = useState('');
  const [applicationReason, setApplicationReason] = useState('');
  const [applicationStatement, setApplicationStatement] = useState('');
  const [applicationMessage, setApplicationMessage] = useState({ type: '', text: '' });
  const [isUserContestant, setIsUserContestant] = useState(false);
  const [viewMode, setViewMode] = useState('vote'); // 'vote' or 'apply'
  const [applicationDocument, setApplicationDocument] = useState(null);
  const [documentPreview, setDocumentPreview] = useState(null);
  const [viewContestant, setViewContestant] = useState(null);
  const documentInputRef = useRef(null);
  const selectedContestRef = useRef(null);

  useEffect(() => {
    selectedContestRef.current = selectedContest;
  }, [selectedContest]);

  useEffect(() => {
    if (searchParams.get('mode') === 'apply') {
      setViewMode('apply');
    }
  }, [searchParams]);

  const getHasVotedState = (contestId) => {
    if (Array.isArray(user?.hasVoted)) {
      return user.hasVoted.some(votedContestId => Number(votedContestId) === Number(contestId));
    }
    return hasUserVotedInContest(user.id, contestId);
  };

  const loadContestsServerFirst = async () => {
    const elections = await fetchElections();
    return elections.map((election) => ({
      id: election.id,
      title: election.title,
      description: election.description,
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status,
      totalVotes: election.totalVotes || 0,
      votingEnabled: election.status === 'active',
    }));
  };

  const loadCandidatesServerFirst = async (contestId) => {
    const candidates = await fetchElectionCandidates(contestId);
    return candidates.map((candidate) => ({ ...candidate, contestId }));
  };

  const formatMs = (ms) => {
    if (!ms || ms <= 0) return '';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    const loadData = async (isInitialLoad = false) => {
      try {
        setDataError('');

        // Load all contests (user can see all, but only vote in active ones with voting enabled)
        const allContests = await loadContestsServerFirst();
        setContests(allContests);

        // Load user's contestant requests
        const requests = getContestantRequestsByUserId(user.id);
        setUserRequests(requests);

        if (allContests.length > 0) {
          let targetContest = null;

          if (selectedContestRef.current && !isInitialLoad) {
            const stillExists = allContests.find(c => String(c.id) === String(selectedContestRef.current.id));
            if (stillExists) {
              targetContest = stillExists;
            }
          }

          if (!targetContest && id) {
            targetContest = allContests.find(c => String(c.id) === String(id));
          }

          if (!targetContest) {
            targetContest = allContests[0];
          }

          if (targetContest) {
            setSelectedContest(targetContest);
            const conts = await loadCandidatesServerFirst(targetContest.id);
            setContestants(conts);
            const voted = getHasVotedState(targetContest.id);
            setHasVoted(voted);
            const isContestant = conts.some(c => String(c.userId) === String(user.id));
            setIsUserContestant(isContestant);
          }
        } else {
          setSelectedContest(null);
          setContestants([]);
        }
      } catch (error) {
        setDataError(error?.message || 'Failed to load live contest data from server.');
      }
    };

    // Initial load
    loadData(true);

    // Auto-refresh data every 3 seconds to sync with admin changes
    // but don't override user's contest selection
    const refreshInterval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => clearInterval(refreshInterval);
  }, [initialized, user, navigate, id]); // Added id to dependency array

  useEffect(() => {
    const tick = () => {
      const status = getVotingWindowStatus();
      setWindowStatus(status);
      setCountdown(formatMs(status.ms));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const getLatestRequestForContest = (contestId) => {
    if (!contestId) return null;
    const contestRequests = userRequests.filter(r => String(r.contestId) === String(contestId));
    if (!contestRequests.length) return null;
    return [...contestRequests].sort(
      (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
    )[0];
  };

  useEffect(() => {
    if (!selectedContest) return;
    const latestRequest = getLatestRequestForContest(selectedContest.id);
    if (latestRequest?.status === 'rejected') {
      setApplicationBio(latestRequest.candidateBio || '');
      setApplicationReason(latestRequest.candidateReason || '');
      setApplicationStatement(latestRequest.statement || '');
      setApplicationDocument(null);
      setDocumentPreview(null);
      if (documentInputRef.current) {
        documentInputRef.current.value = '';
      }
    }
  }, [selectedContest, userRequests]);

  const handleVote = async () => {
    if (!selectedContestant || !selectedContest) return;

    // Check if this specific contest has voting enabled
    if (!selectedContest.votingEnabled) {
      alert('Voting is not enabled for this contest yet.');
      return;
    }

    if (windowStatus.status !== 'open') {
      alert(windowStatus.status === 'upcoming' ? 'Voting has not started yet.' : 'Voting window is closed.');
      return;
    }

    // Prevent voting if user is currently a contestant (live check)
    const latestContestants = await loadCandidatesServerFirst(selectedContest.id);
    const currentlyContestant = latestContestants.some(c => String(c.userId) === String(user.id));
    setIsUserContestant(currentlyContestant);

    if (currentlyContestant) {
      alert('You cannot vote in a contest where you are a contestant.');
      return;
    }

    setLoading(true);
    setShowConfirmModal(false);
    setSelectedContestant(null);

    const result = await voteForContestant(selectedContest.id, selectedContestant.id, confidence);

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setVoteId(result.voteId);
      setHasVoted(true);
      setConfidence(3);

      setTimeout(() => {
        navigate('/user/dashboard');
      }, 3000);
      return;
    }

    alert(result.error || 'Unable to cast vote. Please try again.');
  };

  const handleContestChange = async (contestId) => {
    if (!contestId) return; // Prevent selecting empty option
    
    const contest = contests.find(c => String(c.id) === String(contestId));
    if (!contest) return;

    // Update selected contest
    setSelectedContest(contest);
    
    // Load contestants for this contest
    const conts = await loadCandidatesServerFirst(contest.id);
    setContestants(conts);
    
    // Check if user has voted in this contest
    const voted = getHasVotedState(contest.id);
    setHasVoted(voted);

    // Check if user is a contestant in this contest
    const isContestant = conts.some(c => String(c.userId) === String(user.id));
    setIsUserContestant(isContestant);

    // Clear selected contestant when changing contest
    setSelectedContestant(null);
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setApplicationMessage({
        type: 'error',
        text: 'Document size must be less than 50MB'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    // Validate file type
    const isImage = file.type?.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setApplicationMessage({
        type: 'error',
        text: 'Only image files and PDF documents are allowed'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    // Read file and convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setApplicationDocument({
        name: file.name,
        type: file.type,
        data: reader.result
      });
      setDocumentPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDocument = () => {
    setApplicationDocument(null);
    setDocumentPreview(null);
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
  };

  const handleApplyAsContestant = async () => {
    if (!selectedContest) return;

    const existingRequest = getLatestRequestForContest(selectedContest.id);
    const isRejectedReapply = existingRequest?.status === 'rejected';
    const existingDocument = isRejectedReapply ? existingRequest?.document : null;

    if (existingRequest && !isRejectedReapply) {
      setApplicationMessage({
        type: 'error',
        text: `You have already applied for this contest. Status: ${existingRequest.status}`
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    // Check if user is already a contestant
    if (isUserContestant) {
      setApplicationMessage({
        type: 'error',
        text: 'You are already a contestant in this contest'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    // Check account status
    if (user.accountStatus !== 'approved') {
      setApplicationMessage({
        type: 'error',
        text: 'Your account must be approved to apply as a contestant'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    if (!user.profilePicture) {
      setApplicationMessage({
        type: 'error',
        text: 'Please upload your profile photo in Profile before applying as a contestant'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    if (!applicationBio.trim()) {
      setApplicationMessage({
        type: 'error',
        text: 'Please enter your candidate bio'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    if (!applicationReason.trim()) {
      setApplicationMessage({
        type: 'error',
        text: 'Please enter your reason to become a candidate'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    // Check if document is uploaded (for rejected re-apply, existing document can be reused)
    if (!applicationDocument && !existingDocument) {
      setApplicationMessage({
        type: 'error',
        text: 'Please upload a verification document to continue'
      });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    const result = await addContestantRequest({
      userId: user.id,
      contestId: selectedContest.id,
      userName: user.name,
      userEmail: user.email,
      userProfilePicture: user.profilePicture,
      requestId: isRejectedReapply ? existingRequest.id : undefined,
      candidateBio: applicationBio,
      candidateReason: applicationReason,
      statement: applicationStatement,
      document: applicationDocument || existingDocument || null
    });

    if (result.error) {
      setApplicationMessage({ type: 'error', text: result.error });
      setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
      return;
    }

    // Notify admin
    addNotification({
      userId: 1000, // Admin ID
      type: 'new_contestant_request',
      title: 'New Contestant Application',
      message: `${user.name} has applied to be a contestant in ${selectedContest.title}`,
      link: '/admin/contestant-requests'
    });

    setApplicationMessage({
      type: 'success',
      text: isRejectedReapply
        ? 'Application updated and re-submitted successfully! Waiting for admin approval.'
        : 'Application submitted successfully! Waiting for admin approval.'
    });
    setApplicationBio('');
    setApplicationReason('');
    setApplicationStatement('');
    setApplicationDocument(null);
    setDocumentPreview(null);
    setUserRequests(getContestantRequestsByUserId(user.id));

    setTimeout(() => setApplicationMessage({ type: '', text: '' }), 4000);
  };

  if (!user) return null;

  if (dataError) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          marginBottom: '20px',
          background: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '12px',
          padding: '14px 16px'
        }}>
          {dataError}
        </div>
      </div>
    );
  }

  const votingClosed = windowStatus.status !== 'open' || !selectedContest?.votingEnabled;

  if (hasVoted) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button
          onClick={() => navigate('/user/dashboard')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            color: '#667eea',
            textDecoration: 'none',
            marginBottom: '30px',
            fontWeight: '500',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          <FaArrowLeft /> Back to Dashboard
        </button>

        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          padding: '50px',
          borderRadius: '25px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '3rem',
            color: 'white'
          }}>
            <FaCheckCircle />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '15px', color: '#333' }}>
            You Have Already Voted!
          </h1>
          <p style={{ color: '#666', marginBottom: '30px', fontSize: '1.1rem' }}>
            You have already cast your vote for this contest. Thank you for participating!
          </p>
          <button
            onClick={() => navigate('/user/dashboard')}
            style={{
              padding: '15px 40px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: 'white',
          padding: '50px',
          borderRadius: '25px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '3rem',
            color: 'white'
          }}>
            <FaCheckCircle />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: '15px', color: '#333' }}>
            Vote Cast Successfully! 🎉
          </h1>
          <p style={{ color: '#666', marginBottom: '20px', fontSize: '1.1rem' }}>
            Your vote has been recorded successfully.
          </p>
          <div style={{
            background: '#f8f9fa',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #e0e0e0'
          }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Vote ID:</div>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: '#667eea',
              fontFamily: 'monospace'
            }}>
              {voteId}
            </div>
          </div>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            Redirecting to dashboard in 3 seconds...
          </p>
        </div>
      </div>
    );
  }

  if (contests.length === 0) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{
          textAlign: 'center',
          padding: '80px 40px',
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '20px' }}>📭</div>
          <h2 style={{ color: '#333', fontSize: '2rem', marginBottom: '15px' }}>
            No Contests Available
          </h2>
          <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '30px' }}>
            There are currently no contests created by the administrator.<br/>
            Please check back later or contact the admin.
          </p>
          <button
            onClick={() => navigate('/user/dashboard')}
            style={{
              padding: '12px 30px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '30px',
        background: 'linear-gradient(87deg, #11cdef 0, #1171ef 100%)',
        padding: '40px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '15px' }}>
            <FaVoteYea /> {viewMode === 'vote' ? 'Cast Your Vote' : 'Apply for Contest'}
          </h1>
          <p style={{ margin: '10px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
            {viewMode === 'vote' ? 'Select a contest and choose your preferred candidate' : 'Join the contest as a candidate'}
          </p>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '18px',
        marginBottom: '25px',
        boxShadow: '0 7px 14px rgba(50, 50, 93, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: votingClosed ? '#e53e3e' : '#38a169' }}>
            {!selectedContest?.votingEnabled ? '⏸️ Voting Not Started' : windowStatus.status === 'open' && '✅ Voting is Open'}
            {selectedContest?.votingEnabled && windowStatus.status === 'upcoming' && '⏰ Voting Starts Soon'}
            {selectedContest?.votingEnabled && windowStatus.status === 'closed' && '🔒 Voting Window Closed'}
          </div>
          <div style={{ color: '#4a5568', marginTop: '6px' }}>
            {!selectedContest?.votingEnabled && 'The admin has not started voting for this contest yet. Please check back later.'}
            {selectedContest?.votingEnabled && windowStatus.status === 'open' && `Time left: ${countdown || '—'}`}
            {selectedContest?.votingEnabled && windowStatus.status === 'upcoming' && `Opens in: ${countdown || 'soon'}`}
            {selectedContest?.votingEnabled && windowStatus.status === 'closed' && 'Please check back when a new window opens.'}
          </div>
        </div>
        {votingClosed && (
          <div style={{
            padding: '10px 16px',
            background: '#fff5f5',
            color: '#c53030',
            borderRadius: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <FaExclamationTriangle />
            Voting actions are temporarily disabled
          </div>
        )}
      </div>

      {/* Contest Selector - Always show if there are contests */}
      {contests.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '15px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '2px solid #667eea'
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '0.9rem' }}>
            📊 Select Contest to Vote:
          </label>
          {contests.length === 1 ? (
            <div style={{
              padding: '12px',
              background: '#f0f0ff',
              borderRadius: '8px',
              border: '2px solid #667eea',
              fontWeight: 'bold',
              color: '#667eea',
              fontSize: '1rem'
            }}>
              {selectedContest?.title || contests[0].title}
              {(selectedContest?.votingEnabled || contests[0].votingEnabled) ? ' ✅' : ' ⏸️ (Not Started)'}
            </div>
          ) : (
            <select
              value={selectedContest?.id || ''}
              onChange={(e) => handleContestChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                background: 'white',
                fontWeight: '500'
              }}
            >
              <option value="">Choose a contest...</option>
              {contests.map(contest => (
                <option key={contest.id} value={contest.id}>
                  {contest.title} - {contest.votingEnabled ? '✅ Voting Open' : '⏸️ Not Started'} ({contest.status})
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {selectedContest && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '30px',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '15px',
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '15px'
          }}>
            <h3 style={{ margin: 0, color: '#333', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {viewMode === 'vote' ? `Candidates for ${selectedContest.title}` : `Apply for ${selectedContest.title}`}
              {viewMode === 'vote' && (
                <span style={{
                  padding: '4px 12px',
                  background: '#f0f0ff',
                  color: '#667eea',
                  borderRadius: '20px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold'
                }}>
                  {selectedContest.totalVotes || 0} votes
                </span>
              )}
            </h3>

            <div style={{ display: 'flex', gap: '10px', background: '#f6f9fc', padding: '5px', borderRadius: '10px' }}>
              <button
                onClick={() => setViewMode('vote')}
                style={{
                  padding: '8px 20px',
                  background: viewMode === 'vote' ? 'white' : 'transparent',
                  color: viewMode === 'vote' ? '#667eea' : '#8898aa',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'vote' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaVoteYea /> Candidates
              </button>
              <button
                onClick={() => setViewMode('apply')}
                style={{
                  padding: '8px 20px',
                  background: viewMode === 'apply' ? 'white' : 'transparent',
                  color: viewMode === 'apply' ? '#667eea' : '#8898aa',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'apply' ? '0 2px 5px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <FaUserPlus /> Apply
              </button>
            </div>
          </div>

          {viewMode === 'vote' ? (
            <div>
              {contestants.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '60px 40px', 
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                  borderRadius: '12px',
                  color: '#666'
                }}>
                  <div style={{ fontSize: '4rem', marginBottom: '20px' }}>📭</div>
                  <h3 style={{ color: '#333', marginBottom: '10px' }}>No Candidates Yet</h3>
                  <p style={{ margin: '0', fontSize: '1rem' }}>
                    No candidates have been added to this contest yet.<br/>
                    {!selectedContest?.votingEnabled && 'The admin needs to add candidates and start voting.'}
                  </p>
                </div>
              ) : (
                <div>
                  {!selectedContest?.votingEnabled && (
                    <div style={{
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      marginBottom: '20px',
                      color: '#856404',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <FaExclamationTriangle />
                      <span>Voting has not been started by the admin. You can view candidates but cannot vote yet.</span>
                    </div>
                  )}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px'
                  }}>
                    {contestants.map(contestant => (
                      <div
                        key={contestant.id}
                        onClick={() => !votingClosed && setSelectedContestant(contestant)}
                        style={{
                          padding: '20px',
                          borderRadius: '12px',
                          border: selectedContestant?.id === contestant.id ? '3px solid #667eea' : '2px solid #e0e0e0',
                          background: selectedContestant?.id === contestant.id ? '#f0f0ff' : 'white',
                          cursor: votingClosed ? 'not-allowed' : 'pointer',
                          transition: 'all 0.3s',
                          textAlign: 'center',
                          opacity: votingClosed ? 0.6 : 1,
                          position: 'relative'
                        }}
                      >
                        {selectedContestant?.id === contestant.id && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            background: '#667eea',
                            color: 'white',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1rem'
                          }}>
                            ✓
                          </div>
                        )}
                        <div style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          background: contestant.profilePicture
                            ? `url(${contestant.profilePicture}) center/cover no-repeat`
                            : (selectedContestant?.id === contestant.id ? '#667eea' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
                          margin: '0 auto 15px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                        }}>
                          {!contestant.profilePicture && contestant.name.charAt(0)}
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#333', fontWeight: 'bold' }}>
                          {contestant.name}
                        </h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewContestant(contestant);
                          }}
                          style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            background: '#edf2f7',
                            border: '1px solid #cbd5e0',
                            borderRadius: '8px',
                            color: '#4a5568',
                            cursor: 'pointer',
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                          aria-label={`View details for ${contestant.name}`}
                          title="View candidate details"
                        >
                          <FaEye /> View Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Application Form Section
            <div>
              {isUserContestant ? (
                <div style={{
                  padding: '20px',
                  background: '#e0f7fa',
                  color: '#006064',
                  borderRadius: '10px',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}>
                  <FaCheckCircle /> You are already a contestant in this contest!
                </div>
              ) : (
                <>
                  <p style={{ color: '#666', marginBottom: '20px' }}>
                    Want to participate as a contestant? Submit your application here. Admin approval is required.
                  </p>

                  {applicationMessage.text && (
                    <div style={{
                      padding: '15px 20px',
                      borderRadius: '10px',
                      marginBottom: '20px',
                      background: applicationMessage.type === 'success' ? '#d4edda' : '#f8d7da',
                      color: applicationMessage.type === 'success' ? '#155724' : '#721c24',
                      border: `1px solid ${applicationMessage.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {applicationMessage.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
                      {applicationMessage.text}
                    </div>
                  )}

                  {(() => {
                    const currentRequest = getLatestRequestForContest(selectedContest.id);

                    if (currentRequest && currentRequest.status !== 'rejected') {
                      return (
                        <div style={{
                          padding: '20px',
                          background: '#f8f9fa',
                          borderRadius: '10px',
                          border: '1px solid #e0e0e0'
                        }}>
                          <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FaClock style={{ color: '#667eea' }} />
                            <span style={{ fontWeight: 'bold', color: '#333', fontSize: '1.1rem' }}>
                              Application Status:
                            </span>
                            <span style={{
                              padding: '6px 14px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              background: currentRequest.status === 'approved'
                                ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
                                : currentRequest.status === 'rejected'
                                  ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                                  : 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
                              color: 'white'
                            }}>
                              {currentRequest.status.charAt(0).toUpperCase() + currentRequest.status.slice(1)}
                            </span>
                          </div>
                          <div style={{ color: '#666', marginBottom: '8px' }}>
                            <strong>Your Bio:</strong> {currentRequest.candidateBio || 'No bio provided'}
                          </div>
                          <div style={{ color: '#666', marginBottom: '8px' }}>
                            <strong>Your Reason:</strong> {currentRequest.candidateReason || 'No reason provided'}
                          </div>
                          <div style={{ color: '#666', marginBottom: '8px' }}>
                            <strong>Your Statement:</strong> {currentRequest.statement || 'No statement provided'}
                          </div>
                          {currentRequest.document && (
                            <div style={{ color: '#666', marginBottom: '8px' }}>
                              <strong>Document:</strong> {currentRequest.document.name}{' '}
                              <span style={{
                                fontSize: '0.85rem',
                                color: '#51cf66',
                                fontWeight: 'bold'
                              }}>
                                ✓ Uploaded
                              </span>
                            </div>
                          )}
                          <div style={{ color: '#999', fontSize: '0.9rem' }}>
                            Applied: {new Date(currentRequest.createdAt).toLocaleString()}
                          </div>
                          {currentRequest.status === 'rejected' && currentRequest.rejectionReason && (
                            <div style={{
                              marginTop: '15px',
                              padding: '12px',
                              background: '#fff5f5',
                              borderRadius: '8px',
                              color: '#c53030'
                            }}>
                              <strong>Rejection Reason:</strong> {currentRequest.rejectionReason}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div style={{
                        background: '#f8f9fa',
                        padding: '25px',
                        borderRadius: '10px',
                        border: '1px solid #e0e0e0'
                      }}>
                        <h4 style={{ margin: '0 0 20px 0', color: '#333' }}>
                          {currentRequest?.status === 'rejected' ? 'Edit & Re-apply Application' : 'New Application'}
                        </h4>

                        {currentRequest?.status === 'rejected' && (
                          <div style={{
                            marginBottom: '15px',
                            padding: '12px',
                            background: '#fff5f5',
                            border: '1px solid #feb2b2',
                            borderRadius: '8px',
                            color: '#c53030'
                          }}>
                            <strong>Previous Rejection:</strong> {currentRequest.rejectionReason || 'No reason provided'}
                          </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Profile Photo
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '54px',
                              height: '54px',
                              borderRadius: '50%',
                              background: user.profilePicture
                                ? `url(${user.profilePicture}) center/cover no-repeat`
                                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '1.2rem'
                            }}>
                              {!user.profilePicture && (user.name?.charAt(0) || 'U')}
                            </div>
                            <div style={{ color: '#4a5568', fontSize: '0.92rem' }}>
                              This photo will be shown to admins and voters as your candidate photo.
                            </div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Your Name
                          </label>
                          <input
                            type="text"
                            value={user.name}
                            readOnly
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              background: '#e9ecef',
                              color: '#666',
                              cursor: 'not-allowed'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Your Email
                          </label>
                          <input
                            type="email"
                            value={user.email}
                            readOnly
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              background: '#e9ecef',
                              color: '#666',
                              cursor: 'not-allowed'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Candidate Bio <span style={{ color: '#ff6b6b' }}>*</span>
                          </label>
                          <textarea
                            value={applicationBio}
                            onChange={(e) => setApplicationBio(e.target.value)}
                            placeholder="Describe yourself as a candidate"
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              fontSize: '1rem',
                              background: 'white'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Reason to Become Candidate <span style={{ color: '#ff6b6b' }}>*</span>
                          </label>
                          <textarea
                            value={applicationReason}
                            onChange={(e) => setApplicationReason(e.target.value)}
                            placeholder="Why should users vote for you?"
                            rows={3}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              fontSize: '1rem',
                              background: 'white'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <div style={{
                            padding: '12px',
                            borderRadius: '8px',
                            background: user.profilePicture ? '#e6fffa' : '#fff5f5',
                            border: user.profilePicture ? '1px solid #81e6d9' : '1px solid #feb2b2',
                            color: user.profilePicture ? '#234e52' : '#c53030',
                            fontSize: '0.9rem'
                          }}>
                            {user.profilePicture
                              ? '✓ Profile photo found. This photo will be used for your candidate profile.'
                              : 'Profile photo is required before applying as candidate. Please upload it in Profile page.'}
                          </div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Statement / Reason (Optional)
                          </label>
                          <textarea
                            value={applicationStatement}
                            onChange={(e) => setApplicationStatement(e.target.value)}
                            placeholder="Why do you want to participate in this contest?"
                            rows={4}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              resize: 'vertical',
                              fontFamily: 'inherit',
                              fontSize: '1rem',
                              background: 'white'
                            }}
                          />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>
                            Verification Document (Required) <span style={{ color: '#ff6b6b' }}>*</span>
                          </label>
                          <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>
                            Upload a government-issued ID or verification document (images or PDF, max 50MB)
                            {currentRequest?.status === 'rejected' && currentRequest.document && ' — leave empty to reuse your previous document'}
                          </p>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleDocumentUpload}
                            ref={documentInputRef}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '8px',
                              background: 'white',
                              cursor: 'pointer'
                            }}
                          />
                          {documentPreview && (
                            <div style={{
                              marginTop: '15px',
                              padding: '15px',
                              background: '#f0f9ff',
                              borderRadius: '8px',
                              border: '1px solid #bfdbfe'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#333' }}>
                                  Preview:
                                </div>
                                <button
                                  type="button"
                                  onClick={handleRemoveDocument}
                                  aria-label="Remove document"
                                  title="Remove document"
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#e03131',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    lineHeight: 1
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                              {applicationDocument?.type === 'application/pdf' ? (
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  color: '#1e40af',
                                  fontSize: '0.95rem'
                                }}>
                                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                                  <span>{applicationDocument.name}</span>
                                </div>
                              ) : (
                                <img
                                  src={documentPreview}
                                  alt="Document preview"
                                  style={{
                                    maxWidth: '100%',
                                    maxHeight: '200px',
                                    borderRadius: '8px',
                                    objectFit: 'contain'
                                  }}
                                />
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex' }}>
                          <button
                            onClick={handleApplyAsContestant}
                            style={{
                              padding: '12px 30px',
                              background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px'
                            }}
                          >
                            <FaCheckCircle /> {currentRequest?.status === 'rejected' ? 'Update & Re-apply' : 'Submit Application'}
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {selectedContestant && !votingClosed && (
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: 'linear-gradient(135deg, #f0f0ff 0%, #e8e8ff 100%)',
          borderRadius: '12px',
          border: '2px solid #667eea'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '8px' }}>Selected Candidate:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#667eea', marginBottom: '15px' }}>
              {selectedContestant.name}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={loading || isUserContestant}
                style={{
                  padding: '15px 40px',
                  background: isUserContestant ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: isUserContestant ? 'not-allowed' : 'pointer',
                  fontSize: '1rem',
                  opacity: loading || isUserContestant ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => !isUserContestant && !loading && (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                <FaVoteYea />
                {isUserContestant ? 'Contestants Cannot Vote' : (loading ? 'Submitting...' : 'Confirm Vote')}
              </button>
              <button
                onClick={() => setSelectedContestant(null)}
                style={{
                  padding: '15px 40px',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#d0d0d0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#e0e0e0'}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {votingClosed && contestants.length > 0 && (
        <div style={{
          textAlign: 'center',
          padding: '30px',
          background: '#fff5f5',
          borderRadius: '12px',
          border: '2px solid #feb2b2',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔒</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#c53030', marginBottom: '8px' }}>
            Voting Is Currently Disabled
          </div>
          <div style={{ color: '#666' }}>
            {!selectedContest?.votingEnabled 
              ? 'The administrator has not started voting for this contest yet.'
              : 'The voting window is currently closed. Please check back later.'}
          </div>
        </div>
      )}

      {showConfirmModal && selectedContestant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '12px',
            maxWidth: '400px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Confirm Your Vote</h2>
            <p style={{ color: '#666', marginBottom: '10px' }}>You are voting for:</p>
            <div style={{
              background: '#f8f9fa',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '30px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#667eea'
            }}>
              {selectedContestant?.name}
            </div>
            <p style={{ color: '#999', fontSize: '0.9rem', marginBottom: '30px' }}>
              This action cannot be undone.
            </p>
            <div style={{ marginBottom: '25px', textAlign: 'left' }}>
              <label style={{ fontWeight: 'bold', color: '#333', display: 'block', marginBottom: '8px' }}>
                How confident are you in this vote? (1-5)
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ marginTop: '6px', color: '#4a5568', fontWeight: '600' }}>
                Confidence: {confidence}/5
              </div>
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleVote}
                disabled={loading || votingClosed}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#51cf66',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  opacity: loading || votingClosed ? 0.6 : 1
                }}
              >
                {votingClosed ? 'Not Available' : (loading ? 'Voting...' : 'Confirm')}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {viewContestant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            width: '100%',
            maxWidth: '560px',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#2d3748' }}>Candidate Details</h3>
              <button
                type="button"
                onClick={() => setViewContestant(null)}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: '#718096',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: viewContestant.profilePicture
                  ? `url(${viewContestant.profilePicture}) center/cover no-repeat`
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                fontWeight: 'bold'
              }}>
                {!viewContestant.profilePicture && viewContestant.name?.charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '1.15rem', fontWeight: '700', color: '#1a202c' }}>{viewContestant.name}</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>Bio</div>
              <div style={{ color: '#2d3748', lineHeight: 1.5 }}>
                {viewContestant.bio || viewContestant.statement || 'No bio provided.'}
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontWeight: '700', color: '#4a5568', marginBottom: '6px' }}>Reason to Become Candidate</div>
              <div style={{ color: '#2d3748', lineHeight: 1.5 }}>
                {viewContestant.reason || 'No reason provided.'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedContestant(viewContestant);
                  setViewContestant(null);
                }}
                style={{
                  padding: '10px 16px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Select Candidate
              </button>
              <button
                type="button"
                onClick={() => setViewContestant(null)}
                style={{
                  padding: '10px 16px',
                  background: '#edf2f7',
                  color: '#2d3748',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vote;
