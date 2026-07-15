import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import { getUsers, setUsers as setStoredUsers, appendActivityLog, getActivityLogByUserId, getVotes, getUserVotes, getPendingRequests, updateRequest, addNotification, resetUserVote, updateUser } from '../../utils/storage';
import { FaUsers, FaPlus, FaEdit, FaTrash, FaEye, FaSearch, FaTimes, FaSave, FaUser, FaEnvelope, FaPhone, FaCalendar, FaLock, FaCheckCircle, FaTimesCircle, FaChevronLeft, FaChevronRight, FaVoteYea, FaBan, FaUndo, FaRedo, FaInbox } from 'react-icons/fa';

const Users = () => {
  const { user } = useApp();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [showRequestsTab, setShowRequestsTab] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const itemsPerPage = 4;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    isAdmin: false
  });

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [user, navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const loadUsers = async () => {
    let allUsers = getUsers();
    try {
      const serverUsers = await adminFetch('/api/admin/users');
      if (Array.isArray(serverUsers) && serverUsers.length > 0) {
        allUsers = serverUsers;
        setStoredUsers(serverUsers);
      }
    } catch (error) {
      // Fallback to current storage when backend fetch fails
    }

    setUsers(allUsers.filter(u => !(u.isAdmin && u.email === 'admin@realityshow.com'))); // Exclude only default main admin from list
    filterUsers();
    loadPendingRequests(allUsers);
  };

  const loadPendingRequests = (allUsers = getUsers()) => {
    const requests = getPendingRequests();
    const pendingAccountRequests = allUsers
      .filter(u => u.accountStatus === 'pending')
      .map(u => ({
        id: `account-${u.id}`,
        requestType: 'account_approval',
        userId: u.id,
        data: {
          role: u.isAdmin ? 'admin' : 'user',
          email: u.email
        },
        status: 'pending',
        createdAt: u.createdAt || new Date().toISOString()
      }));

    setPendingRequests([...pendingAccountRequests, ...requests]);
  };

  const filterUsers = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(u =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phoneNumber?.includes(searchTerm)
    );
    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddUser = () => {
    setModalMode('add');
    setFormData({
      name: '',
      email: '',
      phoneNumber: '',
      password: '',
      isAdmin: false
    });
    setSelectedUser(null);
    setShowModal(true);
  };

  const handleEditUser = (userToEdit) => {
    setModalMode('edit');
    setFormData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      phoneNumber: userToEdit.phoneNumber || '',
      password: '',
      isAdmin: userToEdit.isAdmin || false
    });
    setSelectedUser(userToEdit);
    setShowModal(true);
  };

  const handleViewUser = (userToView) => {
    setSelectedUser(userToView);
    setShowViewModal(true);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const allUsers = getUsers();
      const updatedUsers = allUsers.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      appendActivityLog({ type: 'user_deleted', userId: user.id, deletedUserId: userId });
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const userToApprove = users.find(u => String(u.id) === String(userId));
      if (!userToApprove) return;

      await adminFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ accountStatus: 'approved' })
      });

      addNotification({
        userId: userId,
        type: 'account_approved',
        title: 'Account Approved',
        message: 'Your account has been approved! You can now participate in voting.',
        link: '/user/dashboard'
      });

      loadUsers();
      appendActivityLog({
        type: 'user_approved',
        userId: user.id,
        targetUserId: userId,
        action: `Approved user account for ${userToApprove.name}`
      });
      setMessage({ type: 'success', text: 'User approved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error approving user:', error);
      setMessage({ type: 'error', text: 'Failed to approve user' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleSuspendUser = async (userId) => {
    const { addNotification } = require('../../utils/storage');
    const allUsers = getUsers();
    const userToSuspend = allUsers.find(u => u.id === userId);

    if (userToSuspend) {
      const newStatus = userToSuspend.accountStatus === 'suspended' ? 'approved' : 'suspended';
      await adminFetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ accountStatus: newStatus })
      });

      if (newStatus === 'suspended') {
        addNotification({
          userId: userId,
          type: 'account_suspended',
          title: 'Account Suspended',
          message: 'Your account has been suspended. Please contact support for more information.',
          link: '/user/dashboard'
        });
      } else {
        addNotification({
          userId: userId,
          type: 'account_approved',
          title: 'Account Restored',
          message: 'Your account has been restored. You can now vote again!',
          link: '/user/dashboard'
        });
      }

      loadUsers();
      appendActivityLog({
        type: newStatus === 'suspended' ? 'user_suspended' : 'user_restored',
        userId: user.id,
        targetUserId: userId
      });
      setMessage({ type: 'success', text: `User ${newStatus === 'suspended' ? 'suspended' : 'restored'} successfully!` });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleResetVote = (userId, contestId) => {
    const result = resetUserVote(userId, contestId);

    if (result.success) {
      addNotification({
        userId: userId,
        type: 'vote_reset',
        title: 'Vote Reset',
        message: 'Your vote has been reset by an administrator. You can vote again.',
        link: '/user/dashboard'
      });
      loadUsers();
      appendActivityLog({ type: 'vote_reset', userId: user.id, targetUserId: userId, contestId: contestId });
      setMessage({ type: 'success', text: 'Vote reset successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to reset vote' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleApproveRequest = async (requestId) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    if (request.requestType === 'account_approval') {
      await handleApproveUser(request.userId);
      loadPendingRequests();
      return;
    }

    if (request.requestType === 'username_change' && request.data.newUsername) {
      // Update username
      const updatedUser = updateUser(request.userId, { name: request.data.newUsername });

      // Update request
      const updated = updateRequest(requestId, {
        status: 'approved',
        reviewedBy: user.id
      });

      // Notify user
      addNotification({
        userId: request.userId,
        type: 'request_approved',
        title: 'Username Change Approved',
        message: `Your username has been changed to "${request.data.newUsername}"`,
        link: '/user/profile'
      });

      loadUsers();
      loadPendingRequests();
      appendActivityLog({
        type: 'request_approved',
        userId: user.id,
        targetUserId: request.userId,
        requestType: request.requestType,
        action: `Approved username change request for user ${updatedUser.name}`
      });
      setMessage({ type: 'success', text: 'Request approved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } else if (request.requestType === 'vote_reset') {
      // Handle vote reset request
      const { getVotes } = require('../../utils/storage');
      const votes = getVotes();
      const userVotes = votes.filter(v => String(v.userId) === String(request.userId));

      if (userVotes.length > 0) {
        // Reset the first vote (or all votes based on requirement)
        const voteToReset = userVotes[0];
        const result = resetUserVote(request.userId, voteToReset.contestId);

        if (result.success) {
          const updated = updateRequest(requestId, {
            status: 'approved',
            reviewedBy: user.id
          });

          addNotification({
            userId: request.userId,
            type: 'request_approved',
            title: 'Vote Reset Approved',
            message: 'Your vote reset request has been approved. You can vote again.',
            link: '/user/dashboard'
          });

          loadUsers();
          loadPendingRequests();
          appendActivityLog({
            type: 'request_approved',
            userId: user.id,
            targetUserId: request.userId,
            requestType: request.requestType,
            action: `Approved vote reset request for user`
          });
          setMessage({ type: 'success', text: 'Vote reset request approved successfully!' });
          setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
      }
    }
  };

  const handleRejectRequest = async (requestId) => {
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) return;

    if (request.requestType === 'account_approval') {
      await adminFetch(`/api/admin/users/${request.userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ accountStatus: 'suspended' })
      });
      addNotification({
        userId: request.userId,
        type: 'request_rejected',
        title: 'Account Request Rejected',
        message: 'Your account approval request has been rejected. Please contact an administrator.',
        link: '/'
      });

      loadUsers();
      appendActivityLog({
        type: 'request_rejected',
        userId: user.id,
        targetUserId: request.userId,
        requestType: request.requestType,
        action: 'Rejected account approval request'
      });
      setMessage({ type: 'success', text: 'Account request rejected successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }

    const updated = updateRequest(requestId, {
      status: 'rejected',
      reviewedBy: user.id
    });

    addNotification({
      userId: request.userId,
      type: 'request_rejected',
      title: 'Request Rejected',
      message: `Your ${request.requestType?.replace('_', ' ')} request has been rejected.`,
      link: '/user/requests'
    });

    loadPendingRequests();
    appendActivityLog({
      type: 'request_rejected',
      userId: user.id,
      targetUserId: request.userId,
      requestType: request.requestType,
      action: `Rejected ${request.requestType} request`
    });
    setMessage({ type: 'success', text: 'Request rejected successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const allUsers = getUsers();

      if (modalMode === 'add') {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setMessage({ type: 'error', text: 'Invalid email format' });
          setLoading(false);
          return;
        }

        // Validate phone number if provided
        if (formData.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
          setMessage({ type: 'error', text: 'Invalid phone number format' });
          setLoading(false);
          return;
        }

        // Validate email uniqueness
        const emailExists = allUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase());
        if (emailExists) {
          setMessage({ type: 'error', text: 'Email already exists!' });
          setLoading(false);
          return;
        }

        // Validate password
        if (!formData.password || formData.password.length < 6) {
          setMessage({ type: 'error', text: 'Password must be at least 6 characters long!' });
          setLoading(false);
          return;
        }

        // Create new user
        const nextId = allUsers.length ? Math.max(...allUsers.map(u => Number(u.id))) + 1 : 1;
        const newUser = {
          id: nextId,
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber || '',
          password: formData.password,
          isAdmin: formData.isAdmin || false,
          accountStatus: formData.isAdmin ? 'approved' : 'pending',
          createdAt: new Date().toISOString(),
          hasVoted: [],
          profilePicture: null,
          lastLogin: null
        };

        const updatedUsers = [...allUsers, newUser];
        setUsers(updatedUsers);
        setUsers(updatedUsers.filter(u => !u.isAdmin || u.email === 'admin@realityshow.com'));

        appendActivityLog({ type: 'user_created', userId: user.id, createdUserId: nextId });
        setMessage({ type: 'success', text: 'User created successfully!' });
      } else {
        // Edit existing user
        const emailExists = allUsers.some(u =>
          u.id !== selectedUser.id && u.email.toLowerCase() === formData.email.toLowerCase()
        );
        if (emailExists) {
          setMessage({ type: 'error', text: 'Email already exists!' });
          setLoading(false);
          return;
        }

        const updatedUsers = allUsers.map(u => {
          if (u.id === selectedUser.id) {
            return {
              ...u,
              name: formData.name,
              email: formData.email,
              phoneNumber: formData.phoneNumber || '',
              password: formData.password || u.password, // Keep old password if not changed
              isAdmin: formData.isAdmin || false,
              updatedAt: new Date().toISOString()
            };
          }
          return u;
        });

        setUsers(updatedUsers);

        appendActivityLog({ type: 'user_updated', userId: user.id, updatedUserId: selectedUser.id });
        setMessage({ type: 'success', text: 'User updated successfully!' });
      }

      setShowModal(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = (userId) => {
    const votes = getVotes();
    const userVotes = getUserVotes();
    const userVoteCount = userVotes[String(userId)]?.length || 0;
    const userVotesList = votes.filter(v => String(v.userId) === String(userId));

    return {
      totalVotes: userVoteCount,
      voteHistory: userVotesList
    };
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const displayTotalPages = Math.max(1, totalPages);
  const pagesPerChunk = 4;
  const chunkStart = Math.floor((currentPage - 1) / pagesPerChunk) * pagesPerChunk + 1;
  const chunkEnd = Math.min(displayTotalPages, chunkStart + pagesPerChunk - 1);
  const visiblePages = Array.from({ length: Math.max(0, chunkEnd - chunkStart + 1) }, (_, i) => chunkStart + i);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < displayTotalPages;

  useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
      return;
    }

    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  if (!user || !user.isAdmin) {
    return null;
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{
            fontSize: '2.5rem',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            <FaUsers style={{ marginRight: '10px' }} />
            User Management
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '1.1rem' }}>Manage all users in the system</p>
        </div>
        <button
          onClick={handleAddUser}
          style={{
            padding: '12px 25px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '1rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <FaPlus /> Add New User
        </button>
      </div>

      {/* Messages */}
      {message.text && (
        <div style={{
          padding: '15px 20px',
          borderRadius: '10px',
          marginBottom: '20px',
          background: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <button
          onClick={() => setShowRequestsTab(false)}
          style={{
            padding: '12px 25px',
            background: !showRequestsTab
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'transparent',
            color: !showRequestsTab ? 'white' : '#666',
            border: 'none',
            borderRadius: '12px 12px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FaUsers /> Users
          {pendingRequests.length > 0 && !showRequestsTab && (
            <span style={{
              padding: '2px 8px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '12px',
              fontSize: '0.85rem'
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setShowRequestsTab(true)}
          style={{
            padding: '12px 25px',
            background: showRequestsTab
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'transparent',
            color: showRequestsTab ? 'white' : '#666',
            border: 'none',
            borderRadius: '12px 12px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            position: 'relative'
          }}
        >
          <FaInbox /> User Requests
          {pendingRequests.length > 0 && (
            <span style={{
              padding: '2px 8px',
              background: showRequestsTab ? 'rgba(255,255,255,0.3)' : '#ff6b6b',
              color: showRequestsTab ? 'white' : 'white',
              borderRadius: '12px',
              fontSize: '0.85rem',
              fontWeight: 'bold'
            }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* User Requests Section */}
      {showRequestsTab && (
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FaInbox /> Pending User Requests
          </h2>
          {pendingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
              <FaInbox style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }} />
              <h3>No Pending Requests</h3>
              <p>All user requests have been reviewed</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {pendingRequests.map(request => {
                const requestUser = getUsers().find(u => String(u.id) === String(request.userId));
                return (
                  <div
                    key={request.id}
                    style={{
                      padding: '20px',
                      background: '#f8f9fa',
                      borderRadius: '15px',
                      border: '1px solid #e0e0e0',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.transform = 'translateX(5px)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.transform = 'translateX(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px', flexWrap: 'wrap', gap: '15px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 'bold', color: '#333' }}>
                          {request.requestType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Request'}
                        </h3>
                        {requestUser && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            {requestUser.profilePicture ? (
                              <img
                                src={requestUser.profilePicture}
                                alt={requestUser.name || 'User'}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                  border: '2px solid #e0e0e0',
                                  flexShrink: 0
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                flexShrink: 0
                              }}>
                                {requestUser.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                              <strong>From:</strong> {requestUser.name} ({requestUser.email})
                            </p>
                          </div>
                        )}
                        <p style={{ margin: 0, color: '#999', fontSize: '0.85rem' }}>
                          Submitted: {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span style={{
                        padding: '6px 14px',
                        background: '#ffd43b',
                        color: '#333',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold'
                      }}>
                        Pending
                      </span>
                    </div>

                    {request.data && (
                      <div style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '10px',
                        marginBottom: '15px'
                      }}>
                        {request.requestType === 'username_change' && request.data.newUsername && (
                          <p style={{ margin: '0 0 10px', color: '#666' }}>
                            <strong>Requested Username:</strong> <span style={{ color: '#667eea', fontWeight: 'bold' }}>{request.data.newUsername}</span>
                          </p>
                        )}
                        {request.data.reason && (
                          <p style={{ margin: 0, color: '#666', lineHeight: '1.6' }}>
                            <strong>Reason:</strong> {request.data.reason}
                          </p>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(255, 107, 107, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <FaTimesCircle /> Reject
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        style={{
                          padding: '10px 20px',
                          background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '0.9rem',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                          e.currentTarget.style.boxShadow = '0 5px 15px rgba(81, 207, 102, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <FaCheckCircle /> Approve
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Search Bar and Users Table */}
      {!showRequestsTab && (
        <>
          {/* Search Bar */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ position: 'relative', maxWidth: '500px' }}>
              <FaSearch style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--muted)'
              }} />
              <input
                type="text"
                placeholder="Search users by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 15px 12px 45px',
                  border: '2px solid var(--border)',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-1)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          </div>

          {/* Users Table */}
          <div style={{
            background: 'var(--surface)',
            padding: '30px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            overflowX: 'auto'
          }}>
            {filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <FaUsers style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }} />
                <h3>No Users Found</h3>
                <p>{searchTerm ? 'Try adjusting your search terms' : 'No users in the system yet'}</p>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--muted)', margin: 0 }}>
                    Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} users
                  </p>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text)' }}>Name</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text)' }}>Email</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text)' }}>Phone</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text)' }}>Role</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text)' }}>Status</th>
                      <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold', color: 'var(--text)' }}>Votes</th>
                      <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', color: 'var(--text)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.map((u) => {
                      const stats = getUserStats(u.id);
                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-2)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {u.profilePicture ? (
                                <img
                                  src={u.profilePicture}
                                  alt={u.name || 'User'}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    flexShrink: 0,
                                    border: '2px solid var(--border)'
                                  }}
                                />
                              ) : (
                                <div style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 'bold',
                                  flexShrink: 0
                                }}>
                                  {u.name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <span style={{ fontWeight: '500' }}>{u.name || 'N/A'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '15px', color: 'var(--muted)' }}>{u.email}</td>
                          <td style={{ padding: '15px', color: 'var(--muted)' }}>{u.phoneNumber || 'N/A'}</td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              background: u.isAdmin
                                ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                                : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                              color: 'white'
                            }}>
                              {u.isAdmin ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <span style={{
                              padding: '5px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: 'bold',
                              background: u.accountStatus === 'approved'
                                ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
                                : u.accountStatus === 'pending'
                                  ? 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)'
                                  : u.accountStatus === 'suspended'
                                    ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)'
                                    : 'linear-gradient(135deg, #999 0%, #777 100%)',
                              color: 'white'
                            }}>
                              {(u.accountStatus || 'pending').charAt(0).toUpperCase() + (u.accountStatus || 'pending').slice(1)}
                            </span>
                          </td>
                          <td style={{ padding: '15px', color: 'var(--muted)' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{stats.totalVotes}</span>
                          </td>
                          <td style={{ padding: '15px' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              {u.accountStatus === 'pending' && (
                                <button
                                  onClick={() => handleApproveUser(u.id)}
                                  style={{
                                    padding: '8px 12px',
                                    background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontWeight: 'bold'
                                  }}
                                  title="Approve User"
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  <FaCheckCircle /> Approve
                                </button>
                              )}
                              {!u.isAdmin && u.accountStatus !== 'pending' && (
                                <button
                                  onClick={() => handleSuspendUser(u.id)}
                                  style={{
                                    padding: '6px 10px',
                                    background: u.accountStatus === 'suspended'
                                      ? 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)'
                                      : 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '0.8rem',
                                    transition: 'all 0.3s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                  }}
                                  title={u.accountStatus === 'suspended' ? 'Restore User' : 'Suspend User'}
                                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                  {u.accountStatus === 'suspended' ? <FaRedo /> : <FaBan />}
                                  {u.accountStatus === 'suspended' ? 'Restore' : 'Suspend'}
                                </button>
                              )}
                              <button
                                onClick={() => handleViewUser(u)}
                                style={{
                                  padding: '6px 10px',
                                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.3s ease'
                                }}
                                title="View Details"
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleEditUser(u)}
                                style={{
                                  padding: '6px 10px',
                                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.3s ease'
                                }}
                                title="Edit User"
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                style={{
                                  padding: '8px 12px',
                                  background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.9rem',
                                  transition: 'all 0.3s ease'
                                }}
                                title="Delete User"
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                              >
                                <FaTrash /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
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
              </>
            )}
          </div>
        </>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div style={{
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
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0 }}>
                {modalMode === 'add' ? 'Add New User' : 'Edit User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '5px 10px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Password {modalMode === 'add' ? '*' : '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required={modalMode === 'add'}
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
                {modalMode === 'add' && (
                  <p style={{ marginTop: '5px', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Must be at least 6 characters long
                  </p>
                )}
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleInputChange}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 'bold' }}>Admin User</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 25px',
                    background: 'var(--surface-2)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    borderRadius: '10px',
                    fontSize: '1rem',
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
                    padding: '12px 25px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <FaSave /> {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Details Modal */}
      {showViewModal && selectedUser && (
        <div style={{
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
          onClick={() => setShowViewModal(false)}
        >
          <div
            style={{
              background: 'var(--surface)',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
              <h2 style={{ fontSize: '1.8rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaEye /> User Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  padding: '5px 10px'
                }}
              >
                <FaTimes />
              </button>
            </div>

            {(() => {
              const stats = getUserStats(selectedUser.id);
              return (
                <>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    marginBottom: '30px',
                    padding: '20px',
                    background: 'var(--surface-2)',
                    borderRadius: '15px'
                  }}>
                    {selectedUser.profilePicture ? (
                      <img
                        src={selectedUser.profilePicture}
                        alt={selectedUser.name || 'User'}
                        style={{
                          width: '80px',
                          height: '80px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          border: '3px solid var(--border)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: '2rem'
                      }}>
                        {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 5px', fontSize: '1.5rem' }}>{selectedUser.name}</h3>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>{selectedUser.email}</p>
                      <span style={{
                        display: 'inline-block',
                        marginTop: '10px',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        background: selectedUser.isAdmin
                          ? 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
                          : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                        color: 'white'
                      }}>
                        {selectedUser.isAdmin ? 'Admin' : 'User'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div style={{ padding: '15px', background: 'var(--surface-2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <FaEnvelope style={{ color: 'var(--accent-1)' }} />
                        <strong>Email:</strong>
                      </div>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>{selectedUser.email}</p>
                    </div>

                    <div style={{ padding: '15px', background: 'var(--surface-2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <FaPhone style={{ color: 'var(--accent-1)' }} />
                        <strong>Phone:</strong>
                      </div>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>{selectedUser.phoneNumber || 'N/A'}</p>
                    </div>

                    <div style={{ padding: '15px', background: 'var(--surface-2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <FaCalendar style={{ color: 'var(--accent-1)' }} />
                        <strong>Joined:</strong>
                      </div>
                      <p style={{ margin: 0, color: 'var(--muted)' }}>
                        {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>

                    <div style={{ padding: '15px', background: 'var(--surface-2)', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <FaVoteYea style={{ color: 'var(--accent-1)' }} />
                        <strong>Total Votes:</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-1)' }}>
                        {stats.totalVotes}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '30px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => {
                        setShowViewModal(false);
                        handleEditUser(selectedUser);
                      }}
                      style={{
                        padding: '12px 25px',
                        background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaEdit /> Edit User
                    </button>
                    <button
                      onClick={() => setShowViewModal(false)}
                      style={{
                        padding: '12px 25px',
                        background: 'var(--surface-2)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
