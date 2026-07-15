import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import {
  getRequests, updateRequest,
  getUserById, addNotification, addActivityLog
} from '../../utils/storage';
import {
  FaClipboardList, FaCheckCircle, FaTimesCircle, FaClock,
  FaUser, FaStar, FaBriefcase, FaEnvelope, FaExclamationTriangle
} from 'react-icons/fa';

const CandidateApplications = () => {
  const { user, refreshData } = useApp();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [activeContests, setActiveContests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedContestId, setSelectedContestId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    const allRequests = getRequests();
    const candidateApps = allRequests.filter(r => r.requestType === 'candidate_application').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Enrich with user data
    const enriched = candidateApps.map(app => {
      const applicant = getUserById(app.userId);
      return { ...app, applicantName: applicant?.name || 'Unknown User', applicantEmail: applicant?.email };
    });

    setApplications(enriched);

    try {
      const contests = await adminFetch('/api/elections');
      setActiveContests(Array.isArray(contests) ? contests : []);
    } catch {
      setActiveContests([]);
    }

    refreshData();
  };

  const handleReject = async (appId) => {
    if (!window.confirm('Are you sure you want to reject this application?')) return;

    try {
      updateRequest(appId, { status: 'rejected', reviewedBy: user.id });

      const app = applications.find(a => a.id === appId);
      if (app) {
        addNotification({
          userId: app.userId,
          type: 'request_rejected',
          title: 'Application Rejected',
          message: 'Your application to become a candidate has been rejected.'
        });

        addActivityLog({
          type: 'application_rejected',
          userId: user.id,
          action: `Rejected candidate application from ${app.applicantName}`
        });
      }

      loadData();
      setMessage({ type: 'success', text: 'Application rejected.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to reject application.' });
    }
  };

  const initApprove = (app) => {
    setSelectedApplication(app);
    setSelectedContestId(activeContests[0]?.id || '');
    setShowApproveModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedContestId) {
      setMessage({ type: 'error', text: 'Please select a contest.' });
      return;
    }

    setLoading(true);
    try {
      // 1. Update request status
      updateRequest(selectedApplication.id, { status: 'approved', reviewedBy: user.id });

      // 2. Add as candidate in MongoDB-backed API
      await adminFetch('/api/admin/candidates', {
        method: 'POST',
        body: JSON.stringify({
          electionId: selectedContestId,
          name: selectedApplication.applicantName,
          position: selectedApplication.data?.talent || 'Contestant',
          bio: `Talent: ${selectedApplication.data?.talent || 'N/A'}. ${selectedApplication.data?.reason || ''}`,
          image: null
        })
      });

      // 3. Notify user
      addNotification({
        userId: selectedApplication.userId,
        type: 'request_approved',
        title: 'Application Approved!',
        message: 'Congratulations! Your application has been approved and you have been added as a candidate.'
      });

      addActivityLog({
        type: 'application_approved',
        userId: user.id,
        action: `Approved candidate application from ${selectedApplication.applicantName}`
      });

      await loadData();
      setShowApproveModal(false);
      setSelectedApplication(null);
      setMessage({ type: 'success', text: 'Application approved and candidate added!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);

    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to approve application.' });
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const pagesPerChunk = 4;
  const chunkStart = Math.floor((currentPage - 1) / pagesPerChunk) * pagesPerChunk + 1;
  const chunkEnd = Math.min(totalPages, chunkStart + pagesPerChunk - 1);
  const visiblePages = Array.from({ length: Math.max(0, chunkEnd - chunkStart + 1) }, (_, i) => chunkStart + i);
  const hasPreviousChunk = chunkStart > 1;
  const hasNextChunk = chunkEnd < totalPages;
  const currentItems = applications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user || !user.isAdmin) return null;

  return (
    <section style={{ padding: '30px 0', minHeight: '100vh', background: 'var(--bg-top)' }}>
      <div className="container">
        <h1 style={{
          fontSize: '2.5rem',
          marginBottom: '30px',
          background: 'linear-gradient(135deg, #11cdef 0%, #1171ef 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <FaClipboardList /> Candidate Applications
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
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {message.text}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {applications.length === 0 ? (
            <div style={{
              background: 'white',
              padding: '60px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <FaClipboardList style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }} />
              <h3 style={{ marginBottom: '10px', color: '#666' }}>No Applications</h3>
              <p style={{ color: '#999' }}>There are no candidate applications to review.</p>
            </div>
          ) : (
            currentItems.map(app => (
              <div
                key={app.id}
                style={{
                  background: 'white',
                  padding: '30px',
                  borderRadius: '20px',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  borderLeft: app.status === 'pending' ? '5px solid #ff9800' : app.status === 'approved' ? '5px solid #51cf66' : '5px solid #ff6b6b'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 5px', fontSize: '1.4rem', color: '#333' }}>{app.applicantName}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', color: '#666', fontSize: '0.9rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaEnvelope /> {app.applicantEmail}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><FaClock /> {new Date(app.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <span style={{
                    padding: '6px 15px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    fontWeight: 'bold',
                    background: app.status === 'pending' ? '#fff3cd' : app.status === 'approved' ? '#d3f9d8' : '#ffe3e3',
                    color: app.status === 'pending' ? '#856404' : app.status === 'approved' ? '#155724' : '#721c24',
                    border: `1px solid ${app.status === 'pending' ? '#ffeeba' : app.status === 'approved' ? '#c3e6cb' : '#f5c6cb'}`
                  }}>
                    {app.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '15px' }}>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '5px', color: '#666' }}><FaStar /> Talent/Skill</strong>
                      <span style={{ fontSize: '1.1rem' }}>{app.data.talent}</span>
                    </div>
                    <div>
                      <strong style={{ display: 'block', marginBottom: '5px', color: '#666' }}><FaBriefcase /> Experience</strong>
                      <span style={{ fontSize: '1.1rem' }}>{app.data.experience ? `${app.data.experience} years` : 'N/A'}</span>
                    </div>
                  </div>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '5px', color: '#666' }}>Reason</strong>
                    <p style={{ margin: 0, lineHeight: '1.6' }}>{app.data.reason}</p>
                  </div>
                </div>

                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleReject(app.id)}
                      style={{
                        padding: '10px 25px',
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
                      <FaTimesCircle /> Reject
                    </button>
                    <button
                      onClick={() => initApprove(app)}
                      style={{
                        padding: '10px 25px',
                        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
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
                      <FaCheckCircle /> Approve & Add
                    </button>
                  </div>
                )}
              </div>
            ))
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
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
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
          onClick={() => setShowApproveModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '25px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Approve Candidate</h2>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              Select which contest to add <strong>{selectedApplication?.applicantName}</strong> to:
            </p>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Contest *</label>
              <select
                value={selectedContestId}
                onChange={(e) => setSelectedContestId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  background: 'white'
                }}
              >
                <option value="">Select Contest...</option>
                {activeContests.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowApproveModal(false)}
                style={{
                  padding: '12px 25px',
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
                onClick={handleApproveConfirm}
                disabled={loading}
                style={{
                  padding: '12px 25px',
                  background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default CandidateApplications;
