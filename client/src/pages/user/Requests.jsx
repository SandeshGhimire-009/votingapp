import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import {
  getRequests,
  setRequests,
  getRequestsByUserId,
  getContestantRequestsByUserId,
  getContests,
  deleteContestantRequest,
  getContestantDocumentById,
  saveContestantDocument,
  updateContestantRequest
} from '../../utils/storage';
import { FaClipboardList, FaClock, FaTrash, FaCheck, FaTimes, FaEdit, FaEye, FaSave, FaUpload } from 'react-icons/fa';

const Requests = () => {
  const { user, initialized } = useApp();
  const navigate = useNavigate();
  const [requests, setRequestsState] = useState([]);
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });
  const [editForm, setEditForm] = useState({
    candidateBio: '',
    candidateReason: '',
    statement: ''
  });

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }
    loadRequests();
  }, [initialized, user, navigate]);

  const loadRequests = () => {
    const contests = getContests() || [];
    const contestTitleById = contests.reduce((acc, c) => {
      acc[String(c.id)] = c.title;
      return acc;
    }, {});

    // Legacy/Generic requests
    const genericRequests = getRequestsByUserId(user.id) || [];

    // Contestant specific applications
    const contestantRequests = (getContestantRequestsByUserId(user.id) || []).map(r => ({
      ...r,
      requestType: 'candidate_application',
      submittedAt: r.resubmittedAt || r.createdAt,
      data: {
        contestId: r.contestId,
        contestTitle: contestTitleById[String(r.contestId)] || `Contest #${r.contestId}`,
        candidateBio: r.candidateBio || '',
        candidateReason: r.candidateReason || '',
        statement: r.statement || ''
      }
    }));

    // Merge and sort by date (newest first)
    const allRequests = [...genericRequests, ...contestantRequests].sort((a, b) =>
      new Date(b.createdAt || b.submittedAt) - new Date(a.createdAt || a.submittedAt)
    );

    setRequestsState(allRequests);
  };

  const handleWithdraw = (requestId) => {
    if (window.confirm('Are you sure you want to withdraw this application?')) {
      const request = requests.find(r => String(r.id) === String(requestId));
      const requestType = request?.requestType || request?.type;

      if (requestType === 'candidate_application') {
        deleteContestantRequest(requestId);
      } else {
        const allRequests = getRequests();
        const updatedRequests = allRequests.filter(r => String(r.id) !== String(requestId));
        setRequests(updatedRequests);
      }

      loadRequests(); // Reload local state
    }
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return '#2dce89';
    if (status === 'rejected') return '#f5365c';
    return '#fb6340'; // pending
  };
  const filteredRequests = requests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getRequestType = (request) => request.requestType || request.type;

  const getRequestDate = (request) => request.updatedAt || request.resubmittedAt || request.createdAt || request.submittedAt;

  const openDetails = async (request) => {
    setSelectedRequest(request);
    setModalMessage({ type: '', text: '' });
    setIsEditing(false);
    setEditForm({
      candidateBio: request?.candidateBio || request?.data?.candidateBio || '',
      candidateReason: request?.candidateReason || request?.data?.candidateReason || '',
      statement: request?.statement || request?.data?.statement || ''
    });

    if (getRequestType(request) === 'candidate_application' && request?.document?.docId) {
      try {
        const doc = await getContestantDocumentById(request.document.docId);
        setSelectedDocument(doc || request.document || null);
      } catch {
        setSelectedDocument(request.document || null);
      }
    } else {
      setSelectedDocument(request?.document || null);
    }

    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
    setSelectedDocument(null);
    setIsEditing(false);
    setModalMessage({ type: '', text: '' });
  };

  const handleDocumentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setModalMessage({ type: 'error', text: 'Document size must be less than 50MB' });
      return;
    }

    const isImage = file.type?.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setModalMessage({ type: 'error', text: 'Only image files and PDF documents are allowed' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedDocument({
        name: file.name,
        type: file.type,
        data: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdits = async () => {
    if (!selectedRequest || getRequestType(selectedRequest) !== 'candidate_application') return;
    if (!String(editForm.candidateBio || '').trim()) {
      setModalMessage({ type: 'error', text: 'Candidate bio is required' });
      return;
    }
    if (!String(editForm.candidateReason || '').trim()) {
      setModalMessage({ type: 'error', text: 'Reason is required' });
      return;
    }

    setSaving(true);
    setModalMessage({ type: '', text: '' });

    try {
      let documentRef = selectedRequest.document || null;
      if (selectedDocument?.data) {
        documentRef = await saveContestantDocument(selectedDocument);
      }

      updateContestantRequest(selectedRequest.id, {
        candidateBio: String(editForm.candidateBio || '').trim(),
        candidateReason: String(editForm.candidateReason || '').trim(),
        statement: String(editForm.statement || '').trim(),
        document: documentRef
      });

      await loadRequests();
      const refreshed = (getContestantRequestsByUserId(user.id) || []).find(r => String(r.id) === String(selectedRequest.id));
      if (refreshed) {
        const contests = getContests() || [];
        const contestTitle = contests.find(c => String(c.id) === String(refreshed.contestId))?.title || `Contest #${refreshed.contestId}`;
        setSelectedRequest({
          ...refreshed,
          requestType: 'candidate_application',
          data: {
            contestId: refreshed.contestId,
            contestTitle,
            candidateBio: refreshed.candidateBio || '',
            candidateReason: refreshed.candidateReason || '',
            statement: refreshed.statement || ''
          }
        });
      }
      setIsEditing(false);
      setModalMessage({ type: 'success', text: 'Application updated successfully.' });
    } catch (error) {
      setModalMessage({ type: 'error', text: error?.message || 'Failed to update application' });
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const currentItems = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!user) return null;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{
        marginBottom: '30px',
        background: 'linear-gradient(87deg, #11cdef 0, #1171ef 100%)',
        padding: '30px',
        borderRadius: '16px',
        color: 'white',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaClipboardList /> My Applications
          </h1>
          <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: '14px' }}>
            Track and manage your candidate applications
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '5px', borderRadius: '8px' }}>
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'white' : 'transparent',
                color: filter === f ? '#1171ef' : 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: filter === f ? 'bold' : 'normal',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontSize: '13px',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px',
          textAlign: 'center',
          boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)'
        }}>
          <FaClipboardList style={{ fontSize: '4rem', color: '#e9ecef', marginBottom: '20px' }} />
          <h3 style={{ color: '#8898aa', marginBottom: '10px' }}>No {filter !== 'all' ? filter : ''} applications found</h3>
          <p style={{ color: '#adb5bd' }}>
            {filter === 'all'
              ? "You haven't submitted any applications yet."
              : `You don't have any items with "${filter}" status.`}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '25px'
        }}>
          {currentItems.map((request, idx) => (
            <div
              key={idx}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 7px 14px rgba(50, 50, 93, 0.1)',
                borderTop: `4px solid ${getStatusColor(request.status)}`,
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#32325d', fontWeight: 700, fontSize: '16px' }}>
                  {getRequestType(request) === 'candidate_application' ? 'Candidate Application' : 'Account Request'}
                </h4>
                <span style={{
                  padding: '4px 10px',
                  background: `${getStatusColor(request.status)}20`,
                  color: getStatusColor(request.status),
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  {request.status === 'approved' && <FaCheck size={10} />}
                  {request.status === 'rejected' && <FaTimes size={10} />}
                  {request.status}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                {getRequestType(request) === 'candidate_application' && (
                  <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                    <div style={{ background: '#f6f9fc', padding: '10px', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: '#8898aa', textTransform: 'uppercase', fontWeight: 600 }}>Contest</span>
                      <span style={{ color: '#525f7f', fontSize: '14px' }}>{request.data?.contestTitle || `Contest #${request.data?.contestId || '-'}`}</span>
                    </div>
                    {request.status === 'rejected' && request.rejectionReason && (
                      <div style={{ background: '#fff5f5', padding: '10px', borderRadius: '8px', border: '1px solid #ffd8d8' }}>
                        <span style={{ display: 'block', fontSize: '11px', color: '#c92a2a', textTransform: 'uppercase', fontWeight: 700 }}>Rejection Note</span>
                        <span style={{ color: '#a61e4d', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{request.rejectionReason}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{
                marginTop: '15px',
                borderTop: '1px solid #f0f0f0',
                paddingTop: '15px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8898aa', fontSize: '12px' }}>
                  <FaClock /> {getRequestDate(request) ? new Date(getRequestDate(request)).toLocaleDateString() : 'N/A'}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => openDetails(request)}
                    title="View Application"
                    aria-label="View Application"
                    style={{
                      background: 'transparent',
                      color: '#1171ef',
                      border: '1px solid #1171ef',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FaEye size={11} /> View
                  </button>
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleWithdraw(request.id)}
                      style={{
                        background: 'transparent',
                        color: '#f5365c',
                        border: '1px solid #f5365c',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f5365c'; e.currentTarget.style.color = 'white'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f5365c'; }}
                    >
                      <FaTrash size={10} /> Withdraw
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetailsModal && selectedRequest && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(17, 24, 39, 0.55)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={closeDetails}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '620px',
              maxHeight: '84vh',
              overflowY: 'auto',
              padding: '18px',
              border: '1px solid #e6edf7',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #edf2f7' }}>
              <div>
                <h3 style={{ margin: 0, color: '#32325d', fontSize: '1.1rem' }}>Application Details</h3>
                <div style={{ color: '#6b7280', fontSize: '12px', marginTop: '2px' }}>
                  {selectedRequest.data?.contestTitle || `Contest #${selectedRequest.data?.contestId || '-'}`}
                </div>
              </div>
              <button onClick={closeDetails} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '20px' }}>
                <FaTimes />
              </button>
            </div>

            {modalMessage.text && (
              <div style={{
                marginBottom: '14px',
                padding: '10px 12px',
                borderRadius: '8px',
                color: modalMessage.type === 'error' ? '#842029' : '#0f5132',
                background: modalMessage.type === 'error' ? '#f8d7da' : '#d1e7dd',
                border: `1px solid ${modalMessage.type === 'error' ? '#f5c2c7' : '#badbcc'}`
              }}>
                {modalMessage.text}
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ background: '#f6f9fc', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8898aa', textTransform: 'uppercase', fontWeight: 600 }}>Contest</div>
                <div style={{ color: '#32325d', fontWeight: 600 }}>{selectedRequest.data?.contestTitle || `Contest #${selectedRequest.data?.contestId || '-'}`}</div>
              </div>

              <div style={{ background: '#f6f9fc', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8898aa', textTransform: 'uppercase', fontWeight: 600 }}>Candidate Bio</div>
                {isEditing ? (
                  <textarea
                    value={editForm.candidateBio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, candidateBio: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #d0d7de' }}
                  />
                ) : (
                  <div style={{ color: '#525f7f', whiteSpace: 'pre-wrap' }}>{selectedRequest.candidateBio || selectedRequest.data?.candidateBio || 'Not provided'}</div>
                )}
              </div>

              <div style={{ background: '#f6f9fc', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8898aa', textTransform: 'uppercase', fontWeight: 600 }}>Reason</div>
                {isEditing ? (
                  <textarea
                    value={editForm.candidateReason}
                    onChange={(e) => setEditForm(prev => ({ ...prev, candidateReason: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #d0d7de' }}
                  />
                ) : (
                  <div style={{ color: '#525f7f', whiteSpace: 'pre-wrap' }}>{selectedRequest.candidateReason || selectedRequest.data?.candidateReason || 'Not provided'}</div>
                )}
              </div>

              <div style={{ background: '#f6f9fc', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8898aa', textTransform: 'uppercase', fontWeight: 600 }}>Statement</div>
                {isEditing ? (
                  <textarea
                    value={editForm.statement}
                    onChange={(e) => setEditForm(prev => ({ ...prev, statement: e.target.value }))}
                    rows={3}
                    style={{ width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #d0d7de' }}
                  />
                ) : (
                  <div style={{ color: '#525f7f', whiteSpace: 'pre-wrap' }}>{selectedRequest.statement || selectedRequest.data?.statement || 'Not provided'}</div>
                )}
              </div>

              <div style={{ background: '#f6f9fc', padding: '10px', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', color: '#8898aa', textTransform: 'uppercase', fontWeight: 600 }}>Uploaded Document</div>
                <div style={{ color: '#525f7f', marginBottom: '8px' }}>{selectedDocument?.name || selectedRequest.document?.name || 'No document'}</div>
                {(selectedDocument?.type || selectedRequest.document?.type) && (
                  <div style={{ color: '#8898aa', fontSize: '12px', marginBottom: '8px' }}>
                    Type: {selectedDocument?.type || selectedRequest.document?.type}
                  </div>
                )}

                {selectedDocument?.data && (selectedDocument.type?.startsWith('image/') || String(selectedDocument.data).startsWith('data:image/')) && (
                  <img src={selectedDocument.data} alt="Uploaded document" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #d0d7de', background: '#fff' }} />
                )}

                {selectedDocument?.data && (selectedDocument.type === 'application/pdf' || String(selectedDocument.data).startsWith('data:application/pdf')) && (
                  <a href={selectedDocument.data} target="_blank" rel="noreferrer" style={{ color: '#1171ef', fontWeight: 600 }}>Open PDF</a>
                )}

                {isEditing && (
                  <label style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1171ef', fontWeight: 600 }}>
                    <FaUpload /> Replace Document
                    <input type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleDocumentUpload} />
                  </label>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
              {!isEditing && getRequestType(selectedRequest) === 'candidate_application' && selectedRequest.status !== 'approved' && (
                <button
                  onClick={() => setIsEditing(true)}
                  style={{ background: 'transparent', border: '1px solid #1171ef', color: '#1171ef', padding: '8px 11px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.9rem' }}
                >
                  <FaEdit size={12} /> Edit
                </button>
              )}
              {isEditing && (
                <button
                  onClick={handleSaveEdits}
                  disabled={saving}
                  style={{ background: '#1171ef', border: 'none', color: 'white', padding: '8px 11px', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, opacity: saving ? 0.7 : 1, fontSize: '0.9rem' }}
                >
                  <FaSave size={12} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
              <button
                onClick={closeDetails}
                style={{ background: '#eef2f7', border: '1px solid #d0d7de', color: '#1f2937', padding: '8px 11px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '30px'
        }}>
          <div style={{
            display: 'flex',
            background: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
          }}>
            <button
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo(0, 0);
              }}
              disabled={currentPage === 1}
              style={{
                padding: '10px 18px',
                background: 'white',
                border: 'none',
                borderRight: '1px solid #e0e0e0',
                color: currentPage === 1 ? '#adb5bd' : '#1171ef',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              Previous
            </button>

            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo(0, 0);
                }}
                style={{
                  padding: '10px 18px',
                  background: currentPage === i + 1 ? '#1171ef' : 'white',
                  border: 'none',
                  borderRight: i + 1 === totalPages ? 'none' : '1px solid #e0e0e0',
                  color: currentPage === i + 1 ? 'white' : '#1171ef',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.9rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {i + 1}
              </button>
            ))}

            <button
              onClick={() => {
                setCurrentPage(prev => Math.min(totalPages, prev + 1));
                window.scrollTo(0, 0);
              }}
              disabled={currentPage === totalPages}
              style={{
                padding: '10px 18px',
                background: 'white',
                border: 'none',
                color: currentPage === totalPages ? '#adb5bd' : '#1171ef',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '0.9rem',
                transition: 'all 0.2s ease'
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
