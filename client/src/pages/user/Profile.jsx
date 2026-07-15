import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getVotes, getContestById, getContestantById, updateUser, getUserBadges } from '../../utils/storage';
import { FaUser, FaArrowLeft, FaEnvelope, FaPhone, FaCalendarAlt, FaShieldAlt, FaCheckCircle, FaLock, FaHistory, FaEdit, FaSave, FaKey, FaExclamationCircle } from 'react-icons/fa';

const Profile = () => {
  const { user, initialized, updateProfile } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    profilePicture: null
  });
  const [formError, setFormError] = useState('');

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const [votingHistory, setVotingHistory] = useState([]);
  const [badges, setBadges] = useState([]);

  const loadVotingHistory = useCallback(() => {
    if (!user) return;

    const votes = getVotes();
    const userVotes = votes.filter(v => String(v.userId) === String(user.id));

    const history = userVotes.map(vote => {
      const contest = getContestById(vote.contestId);
      const contestant = getContestantById(vote.contestantId);
      return {
        ...vote,
        contest: contest,
        contestant: contestant
      };
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    setVotingHistory(history);
  }, [user]);

  useEffect(() => {
    if (!initialized) {
      return;
    }

    if (!user) {
      navigate('/');
      return;
    }

    setFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      profilePicture: user.profilePicture || null
    });

    loadVotingHistory();
    setBadges(getUserBadges(user.id));
  }, [initialized, user, navigate, loadVotingHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormError(''); // Clear error on change
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfilePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFormError('Only image files are allowed for profile photo');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFormError('Profile photo must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profilePicture: reader.result }));
      setFormError('');
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.email.trim()) return 'Email is required';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return 'Invalid email format';

    if (formData.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      return 'Invalid phone number format';
    }

    return null;
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }

    if (updateProfile) {
      const result = await updateProfile({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        profilePicture: formData.profilePicture
      });

      if (result.success) {
        setEditMode(false);
        // Optional: Show success toast
      } else {
        setFormError(result.error || 'Failed to update profile');
      }
    }
  };

  const onUpdatePassword = (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    // Verify current password (using plain text for demo as per existing storage)
    if (user.password !== passwordData.currentPassword) {
      setPasswordMsg({ type: 'error', text: 'Incorrect current password' });
      return;
    }

    // Update password
    updateUser(user.id, { password: passwordData.newPassword });
    setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
              <FaUser />
            </div>
            My Profile
          </h1>
          <p style={{ color: '#6c757d', fontSize: '0.95rem' }}>Manage your account information and settings</p>
        </div>

        {/* Main Content */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          {/* Profile Header Card */}
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '16px',
            padding: '25px',
            marginBottom: '25px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: user.profilePicture
                ? `url(${user.profilePicture}) center/cover no-repeat`
                : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#667eea',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
            }}>
              {!user.profilePicture && (user.name?.charAt(0).toUpperCase() || 'U')}
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '2rem', margin: '0 0 10px 0' }}>{user.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', opacity: 0.9 }}>
                <FaEnvelope /> {user.email}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '20px',
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                <FaShieldAlt /> {user.accountStatus === 'approved' ? 'Verified Account' : 'Pending Approval'}
              </div>
            </div>
          </div>

          <div style={{
            padding: '16px',
            borderRadius: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            marginBottom: '20px'
          }}>
            <div style={{ fontWeight: '700', marginBottom: '10px', color: '#2d3748' }}>Badges</div>
            {badges.length === 0 ? (
              <div style={{ color: '#a0aec0' }}>No badges earned yet</div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {badges.map(badge => (
                  <span key={badge.id} style={{
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {badge.type === 'first_vote' && '🗳️ First Vote'}
                    {badge.type === 'early_voter' && '⏰ Early Voter'}
                    {badge.type === 'profile_complete' && '🧾 Profile Completed'}
                    {badge.type === 'results_viewed' && '🏆 Results Viewer'}
                    {!['first_vote','early_voter','profile_complete','results_viewed'].includes(badge.type) && badge.type}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '30px',
            borderBottom: '2px solid #f0f0f0',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'profile', icon: <FaUser />, label: 'Profile Info' },
              { id: 'history', icon: <FaHistory />, label: 'Voting History' },
              { id: 'security', icon: <FaLock />, label: 'Security' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '15px 30px',
                  background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                  color: activeTab === tab.id ? 'white' : '#666',
                  border: 'none',
                  borderRadius: '12px 12px 0 0',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease'
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '1.5rem', margin: 0, color: '#333' }}>Account Information</h3>
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{
                      padding: '10px 20px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaEdit /> Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleSave}
                      style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <FaSave /> Save
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormError('');
                        setFormData({
                          name: user.name || '',
                          email: user.email || '',
                          phoneNumber: user.phoneNumber || '',
                          profilePicture: user.profilePicture || null
                        });
                      }}
                      style={{
                        padding: '10px 20px',
                        background: '#e0e0e0',
                        color: '#666',
                        border: 'none',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {formError && (
                <div style={{ padding: '15px', background: '#fff5f5', color: '#c53030', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaExclamationCircle /> {formError}
                </div>
              )}

              <div style={{ display: 'grid', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaUser style={{ marginRight: '8px' }} /> Profile Photo (Required for Candidate Application)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <div style={{
                      width: '78px',
                      height: '78px',
                      borderRadius: '50%',
                      background: formData.profilePicture
                        ? `url(${formData.profilePicture}) center/cover no-repeat`
                        : 'linear-gradient(135deg, #cbd5e0 0%, #a0aec0 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.8rem',
                      fontWeight: 'bold'
                    }}>
                      {!formData.profilePicture && (formData.name?.charAt(0)?.toUpperCase() || 'U')}
                    </div>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePhotoUpload}
                        disabled={!editMode}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: '10px',
                          border: '2px solid #e0e0e0',
                          background: editMode ? 'white' : '#f5f5f5',
                          cursor: editMode ? 'pointer' : 'not-allowed'
                        }}
                      />
                      <div style={{ fontSize: '0.8rem', color: '#667eea', marginTop: '6px' }}>
                        JPG/PNG/WebP, max 5MB
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaUser style={{ marginRight: '8px' }} /> Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    disabled
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '1rem',
                      background: '#e9ecef',
                      cursor: 'not-allowed',
                      color: '#6c757d'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#667eea', marginTop: '5px' }}>
                    * To change your name, please visit <button type="button" onClick={() => setActiveTab('security')} style={{ color: '#667eea', fontWeight: 'bold', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>Security Settings</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaEnvelope style={{ marginRight: '8px' }} /> Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '1rem',
                      background: '#e9ecef',
                      cursor: 'not-allowed',
                      color: '#6c757d'
                    }}
                  />
                  <div style={{ fontSize: '0.8rem', color: '#667eea', marginTop: '5px' }}>
                    * To change your email, please visit <button type="button" onClick={() => setActiveTab('security')} style={{ color: '#667eea', fontWeight: 'bold', border: 'none', background: 'transparent', padding: 0, cursor: 'pointer' }}>Security Settings</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaPhone style={{ marginRight: '8px' }} /> Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    disabled={!editMode}
                    placeholder="+1234567890"
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '1rem',
                      background: editMode ? 'white' : '#f5f5f5',
                      cursor: editMode ? 'text' : 'not-allowed'
                    }}
                  />
                </div>

                <div style={{
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  borderRadius: '12px',
                  border: '2px solid rgba(102, 126, 234, 0.2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <FaCalendarAlt style={{ color: '#667eea' }} />
                    <strong>Member Since:</strong> {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaShieldAlt style={{ color: '#667eea' }} />
                    <strong>Account Status:</strong> {user.accountStatus}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#333' }}>
                <FaHistory style={{ marginRight: '10px', color: '#667eea' }} />
                Voting History
              </h3>

              {votingHistory.length > 0 ? (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {votingHistory.map((vote, index) => (
                    <div
                      key={vote.id || index}
                      style={{
                        padding: '20px',
                        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                        borderRadius: '12px',
                        border: '2px solid rgba(102, 126, 234, 0.2)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '15px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
                          {vote.contest?.title || 'Contest'}
                        </div>
                        <div style={{ color: '#666', marginBottom: '5px' }}>
                          Voted for: <strong>{vote.contestant?.name || 'Contestant'}</strong>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#999' }}>
                          <FaCalendarAlt style={{ marginRight: '5px' }} />
                          {new Date(vote.timestamp).toLocaleString()}
                        </div>
                        {vote.confidenceScore !== null && vote.confidenceScore !== undefined && (
                          <div style={{ marginTop: '6px', color: '#4a5568', fontWeight: '600' }}>
                            Confidence: {vote.confidenceScore}/5
                          </div>
                        )}
                      </div>
                      <div style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                      }}>
                        <FaCheckCircle /> Voted
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  padding: '60px',
                  textAlign: 'center',
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
                  borderRadius: '16px',
                  border: '2px dashed rgba(102, 126, 234, 0.2)'
                }}>
                  <FaHistory style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }} />
                  <h4 style={{ marginBottom: '10px', color: '#666' }}>No Voting History</h4>
                  <p style={{ color: '#999', marginBottom: '20px' }}>You haven't participated in any contests yet</p>
                  <Link
                    to="/user/dashboard"
                    style={{
                      display: 'inline-block',
                      padding: '12px 30px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    Start Voting Now
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#333' }}>
                <FaLock style={{ marginRight: '10px', color: '#667eea' }} />
                Security Settings
              </h3>

              {passwordMsg.text && (
                <div style={{
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  background: passwordMsg.type === 'error' ? '#fed7d7' : '#c6f6d5',
                  color: passwordMsg.type === 'error' ? '#c53030' : '#2f855a',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  {passwordMsg.text}
                </div>
              )}

              {/* Identity Update Section */}
              <div style={{ marginBottom: '40px', paddingBottom: '30px', borderBottom: '1px solid #e0e0e0' }}>
                <h4 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#555' }}>Identity Management</h4>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    // Basic validation
                    if (!formData.name.trim()) { setPasswordMsg({ type: 'error', text: 'Name is required' }); return; }
                    if (!formData.email.trim()) { setPasswordMsg({ type: 'error', text: 'Email is required' }); return; }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(formData.email)) { setPasswordMsg({ type: 'error', text: 'Invalid email format' }); return; }

                    const result = await updateProfile({ name: formData.name, email: formData.email, phoneNumber: formData.phoneNumber, profilePicture: formData.profilePicture });
                    if (result.success) {
                      setPasswordMsg({ type: 'success', text: 'Identity updated successfully' });
                    } else {
                      setPasswordMsg({ type: 'error', text: result.error || 'Update failed' });
                    }
                  }}
                  style={{ maxWidth: '500px' }}
                >
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                      <FaUser style={{ marginRight: '8px' }} /> Update Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '2px solid #e0e0e0',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                      <FaEnvelope style={{ marginRight: '8px' }} /> Update Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      style={{
                        width: '100%',
                        padding: '15px',
                        borderRadius: '12px',
                        border: '2px solid #e0e0e0',
                        fontSize: '1rem',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      padding: '12px 25px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FaSave /> Update Identity
                  </button>
                </form>
              </div>

              <h4 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#555' }}>Password Management</h4>

              <form onSubmit={onUpdatePassword} style={{ maxWidth: '500px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaKey style={{ marginRight: '8px' }} /> Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    required
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaLock style={{ marginRight: '8px' }} /> New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#555' }}>
                    <FaLock style={{ marginRight: '8px' }} /> Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '2px solid #e0e0e0',
                      fontSize: '1rem',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    padding: '15px 30px',
                    background: 'linear-gradient(135deg, #11cdef 0%, #1171ef 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08)'
                  }}
                >
                  <FaSave /> Update Password
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </section >
  );
};

export default Profile;
