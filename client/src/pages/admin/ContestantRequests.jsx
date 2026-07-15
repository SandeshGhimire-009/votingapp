import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import {
  getContestantRequests,
  getContests,
  updateContestantRequest,
  addNotification,
  addActivityLog,
  getContestantDocumentById
} from '../../utils/storage';
import {
  FaUserPlus,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFilter,
  FaSearch
} from 'react-icons/fa';

const ContestantRequests = () => {
  const navigate = useNavigate();
  const { user, refreshData } = useApp();
  const [requests, setRequests] = useState([]);
  const [contests, setContests] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [documentCache, setDocumentCache] = useState({});
  const [documentPreview, setDocumentPreview] = useState(null);

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }

    loadData();

    // Auto-refresh data every 2 seconds to sync with new applications
    const refreshInterval = setInterval(() => {
      loadData();
    }, 2000);

    return () => clearInterval(refreshInterval);
  }, [user, navigate]);

  const loadData = async () => {
    const allRequests = getContestantRequests();
    let allContests = getContests();

    try {
      const serverContests = await adminFetch('/api/elections');
      if (Array.isArray(serverContests)) {
        allContests = serverContests;
      }
    } catch {
      // Keep fallback to existing synced state.
    }

    // Sort by newest first
    allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    setRequests(allRequests);
    setContests(allContests);
  };

  const handleApprove = async (requestId) => {
    const request = requests.find(r => String(r.id) === String(requestId));
    if (!request) {
      setMessage({ type: 'error', text: 'Request not found' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      return;
    }

    try {
      await adminFetch('/api/admin/candidates', {
        method: 'POST',
        body: JSON.stringify({
          electionId: request.contestId,
          name: request.userName,
          position: 'Contestant',
          bio: request.candidateBio || request.statement || '',
          image: request.userProfilePicture || ''
        })
      });

      updateContestantRequest(requestId, {
        status: 'approved',
        approvedBy: user.id,
        approvedAt: new Date().toISOString()
      });

      addNotification({
        userId: request.userId,
        type: 'contestant_approved',
        title: 'Contestant Application Approved',
        message: 'Your application to be a contestant has been approved!',
        link: '/user/dashboard'
      });

      addActivityLog({
        type: 'contestant_approved',
        userId: user.id,
        targetUserId: request.userId,
        contestId: request.contestId,
        details: `Approved contestant application for user ${request.userName}`
      });

      setMessage({ type: 'success', text: 'Contestant application approved successfully!' });
      await loadData();
      refreshData();
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to approve application' });
    }

    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    updateContestantRequest(selectedRequest.id, {
      status: 'rejected',
      rejectedBy: user.id,
      rejectedAt: new Date().toISOString(),
      rejectionReason
    });

    addNotification({
      userId: selectedRequest.userId,
      type: 'contestant_rejected',
      title: 'Contestant Application Rejected',
      message: rejectionReason || 'Your application to be a contestant has been rejected.',
      link: '/user/dashboard'
    });

    addActivityLog({
      type: 'contestant_rejected',
      userId: user.id,
      targetUserId: selectedRequest.userId,
      contestId: selectedRequest.contestId,
      details: `Rejected contestant application${rejectionReason ? ': ' + rejectionReason : ''}`
    });

    setMessage({ type: 'success', text: 'Contestant application rejected.' });
    await loadData();
    refreshData();

    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectionReason('');

    setTimeout(() => setMessage({ type: '', text: '' }), 4000);
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setShowRejectModal(true);
  };

  const openDocumentPreview = (request, document) => {
    setDocumentPreview({
      userName: request.userName,
      document
    });
  };

  const getContestName = (contestId) => {
    const contest = contests.find(c => String(c.id) === String(contestId));
    return contest ? contest.title : 'Unknown Contest';
  };

  const filteredRequests = requests
    .filter(r => {
      if (filter === 'all') return true;
      return r.status === filter;
    })
    .filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.userName?.toLowerCase().includes(term) ||
        r.userEmail?.toLowerCase().includes(term) ||
        getContestName(r.contestId).toLowerCase().includes(term)
      );
    });

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const displayTotalPages = Math.max(1, totalPages);
  const pagesPerChunk = 4;
  const chunkStart = Math.floor((currentPage - 1) / pagesPerChunk) * pagesPerChunk + 1;
  const chunkEnd = Math.min(displayTotalPages, chunkStart + pagesPerChunk - 1);
  const visiblePages = Array.from({ length: Math.max(0, chunkEnd - chunkStart + 1) }, (_, i) => chunkStart + i);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < displayTotalPages;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRequests = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm]);

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    let isActive = true;

    const loadDocuments = async () => {
      const missing = currentRequests.filter(request =>
        request.document?.storage === 'indexeddb' &&
        request.document?.docId &&
        !documentCache[request.id]
      );

      if (!missing.length) return;

      const entries = await Promise.all(missing.map(async (request) => {
        try {
          const doc = await getContestantDocumentById(request.document.docId);
          return doc ? [request.id, doc] : null;
        } catch {
          return null;
        }
      }));

      if (!isActive) return;

      const nextCache = entries.reduce((acc, entry) => {
        if (!entry) return acc;
        const [id, doc] = entry;
        acc[id] = doc;
        return acc;
      }, {});

      if (Object.keys(nextCache).length > 0) {
        setDocumentCache(prev => ({ ...prev, ...nextCache }));
      }
    };

    loadDocuments();

    return () => {
      isActive = false;
    };
  }, [currentRequests, documentCache]);

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{
        marginBottom: '30px',
        background: 'linear-gradient(87deg, #11cdef 0, #1171ef 100%)',
        padding: '40px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '2.2rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <FaUserPlus /> Contestant Applications
        </h1>
        <p style={{ margin: '10px 0 0', opacity: 0.8, fontSize: '1.1rem' }}>
          Review and manage contestant applications from users
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '12px',
          marginBottom: '25px',
          background: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
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
        borderRadius: '12px',
        padding: '25px',
        marginBottom: '25px',
        boxShadow: '0 7px 14px rgba(50, 50, 93, 0.08)'
      }}>
        <div style={{
          display: 'flex',
          gap: '15px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <FaFilter style={{ color: '#667eea', fontSize: '1.2rem' }} />
          <button
            onClick={() => setFilter('all')}
            style={{
              padding: '10px 20px',
              background: filter === 'all' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f8f9fa',
              color: filter === 'all' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            All ({statusCounts.all})
          </button>
          <button
            onClick={() => setFilter('pending')}
            style={{
              padding: '10px 20px',
              background: filter === 'pending' ? 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)' : '#f8f9fa',
              color: filter === 'pending' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilter('approved')}
            style={{
              padding: '10px 20px',
              background: filter === 'approved' ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)' : '#f8f9fa',
              color: filter === 'approved' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Approved ({statusCounts.approved})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            style={{
              padding: '10px 20px',
              background: filter === 'rejected' ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)' : '#f8f9fa',
              color: filter === 'rejected' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Rejected ({statusCounts.rejected})
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search by name, email, or contest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 45px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem'
            }}
          />
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.08)'
        }}>
          <FaClock style={{ fontSize: '3rem', color: '#ccc', marginBottom: '20px' }} />
          <h3 style={{ color: '#666', margin: 0 }}>No applications found</h3>
          <p style={{ color: '#999', marginTop: '10px' }}>
            {filter !== 'all'
              ? `No ${filter} applications at this time.`
              : 'There are no contestant applications yet.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {currentRequests.map(request => {
            const displayDocument = request.document?.data
              ? request.document
              : documentCache[request.id]
                ? { ...request.document, ...documentCache[request.id] }
                : null;

            return (
              <div
                key={request.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '16px',
                  boxShadow: '0 7px 14px rgba(50, 50, 93, 0.08)',
                  border: request.status === 'pending' ? '2px solid #ffd43b' : '1px solid #e0e0e0'
                }}
              >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ flex: 1, minWidth: '250px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: request.userProfilePicture
                        ? `url(${request.userProfilePicture}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #11cdef 0%, #1171ef 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.15rem',
                      fontWeight: 'bold'
                    }}>
                      {!request.userProfilePicture && (request.userName?.charAt(0) || '?')}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 2px 0', color: '#333', fontSize: '1.05rem' }}>
                        {request.userName}
                      </h3>
                      <div style={{ color: '#666', fontSize: '0.82rem' }}>{request.userEmail}</div>
                    </div>
                  </div>

                  <div style={{
                    padding: '10px 12px',
                    background: '#f8f9fa',
                    borderRadius: '10px',
                    marginBottom: '10px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px 14px',
                    alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '0.84rem' }}>
                      <strong style={{ color: '#333' }}>Contest:</strong>{' '}
                      <span style={{ color: '#667eea', fontWeight: '600' }}>
                        {getContestName(request.contestId)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.84rem' }}>
                      <strong style={{ color: '#333' }}>Status:</strong>{' '}
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        background: request.status === 'approved'
                          ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
                          : request.status === 'rejected'
                            ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                            : 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
                        color: 'white'
                      }}>
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                    <div style={{ color: '#666', fontSize: '0.84rem' }}>
                      <strong>Applied:</strong> {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {(request.candidateBio || request.candidateReason || request.statement) && (
                    <div style={{
                      padding: '10px 12px',
                      background: '#fff8e1',
                      borderRadius: '10px',
                      borderLeft: '4px solid #ffd43b'
                    }}>
                      {request.candidateBio && (
                        <>
                          <strong style={{ color: '#333', display: 'block', marginBottom: '4px', fontSize: '0.86rem' }}>
                            Candidate Bio:
                          </strong>
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.84rem', lineHeight: 1.35 }}>
                            {request.candidateBio}
                          </p>
                        </>
                      )}
                      {request.candidateReason && (
                        <>
                          <strong style={{ color: '#333', display: 'block', marginBottom: '4px', fontSize: '0.86rem' }}>
                            Reason to Become Candidate:
                          </strong>
                          <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '0.84rem', lineHeight: 1.35 }}>
                            {request.candidateReason}
                          </p>
                        </>
                      )}
                      {request.statement && (
                        <>
                          <strong style={{ color: '#333', display: 'block', marginBottom: '4px', fontSize: '0.86rem' }}>
                            Applicant Statement:
                          </strong>
                          <p style={{ margin: 0, color: '#666', fontSize: '0.84rem', lineHeight: 1.35 }}>
                            {request.statement}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {displayDocument && (
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      background: '#f0f9ff',
                      borderRadius: '10px',
                      borderLeft: '4px solid #3b82f6'
                    }}>
                      <strong style={{ color: '#1e40af', display: 'block', marginBottom: '8px', fontSize: '0.86rem' }}>
                        Verification Document:
                      </strong>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #bfdbfe',
                        flexWrap: 'wrap'
                      }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontWeight: 'bold', color: '#1e40af', marginBottom: '2px', fontSize: '0.84rem' }}>
                            {displayDocument.name || 'Verification document'}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                            {displayDocument.type === 'application/pdf' ? 'PDF Document' : 'Image Document'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => openDocumentPreview(request, displayDocument)}
                            style={{
                              padding: '7px 10px',
                              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              fontSize: '0.76rem'
                            }}
                          >
                            See Document
                          </button>

                          <a
                            href={displayDocument.data}
                            download={displayDocument.name}
                            style={{
                              padding: '7px 10px',
                              background: '#eef2ff',
                              color: '#334155',
                              border: '1px solid #cbd5e1',
                              borderRadius: '6px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              textDecoration: 'none',
                              fontSize: '0.76rem',
                              display: 'inline-block'
                            }}
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {request.status === 'rejected' && request.rejectionReason && (
                    <div style={{
                      marginTop: '15px',
                      padding: '15px',
                      background: '#fff5f5',
                      borderRadius: '10px',
                      borderLeft: '4px solid #ff6b6b'
                    }}>
                      <strong style={{ color: '#c53030', display: 'block', marginBottom: '8px' }}>
                        Rejection Reason:
                      </strong>
                      <p style={{ margin: 0, color: '#c53030' }}>
                        {request.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    minWidth: '140px',
                    flexWrap: 'wrap',
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => handleApprove(request.id)}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        fontSize: '0.8rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <FaCheckCircle /> Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(request)}
                      style={{
                        padding: '8px 12px',
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        justifyContent: 'center',
                        transition: 'transform 0.2s',
                        fontSize: '0.8rem'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <FaTimesCircle /> Reject
                    </button>
                  </div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredRequests.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '30px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            background: '#f2f4f8',
            border: '1px solid #e2e6ee',
            borderRadius: '999px',
            padding: '7px 9px',
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
                borderRadius: '50%',
                background: '#eceff4',
                border: '1px solid #d7dde8',
                color: hasPreviousPage ? '#8a96ab' : '#c6ccd8',
                cursor: hasPreviousPage ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '0.85rem',
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
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: currentPage === page ? '#667eea' : '#f1f3f7',
                  border: currentPage === page ? 'none' : '1px solid #d8deea',
                  color: currentPage === page ? 'white' : '#5e72e4',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.88rem',
                  lineHeight: 1,
                  transition: 'all 0.2s ease'
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
                borderRadius: '50%',
                background: '#eceff4',
                border: '1px solid #d7dde8',
                color: hasNextPage ? '#667eea' : '#c6ccd8',
                cursor: hasNextPage ? 'pointer' : 'not-allowed',
                fontWeight: '700',
                fontSize: '0.85rem',
                lineHeight: 1,
                transition: 'all 0.2s ease'
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <FaTimesCircle style={{ color: '#ff6b6b' }} />
              Reject Application
            </h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              You are about to reject the application from <strong>{selectedRequest.userName}</strong>.
            </p>
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                Rejection Reason (Optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '10px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px' }}>
              <button
                onClick={handleReject}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedRequest(null);
                  setRejectionReason('');
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#e0e0e0',
                  color: '#333',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {documentPreview && (
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
            zIndex: 10001,
            padding: '20px'
          }}
          onClick={() => setDocumentPreview(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '14px',
              width: 'min(900px, 100%)',
              maxHeight: '90vh',
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '14px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: '700', color: '#1f2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {documentPreview.document.name || 'Verification Document'}
                </div>
                <div style={{ fontSize: '0.82rem', color: '#6b7280' }}>
                  Applicant: {documentPreview.userName || 'Unknown'}
                </div>
              </div>

              <button
                onClick={() => setDocumentPreview(null)}
                style={{
                  padding: '8px 12px',
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#334155'
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '14px', overflow: 'auto', background: '#f8fafc' }}>
              {documentPreview.document.type === 'application/pdf' ? (
                <iframe
                  src={documentPreview.document.data}
                  title="Verification document preview"
                  style={{
                    width: '100%',
                    height: '70vh',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    background: 'white'
                  }}
                />
              ) : (
                <img
                  src={documentPreview.document.data}
                  alt="Verification document preview"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    background: 'white'
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestantRequests;
