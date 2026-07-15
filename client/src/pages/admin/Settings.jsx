import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { getSettings, updateSettings, addActivityLog, updateUser } from '../../utils/storage';
import { FaCog, FaSave, FaImage, FaToggleOn, FaToggleOff, FaUpload, FaCheckCircle, FaTimesCircle, FaUser, FaEnvelope, FaKey, FaExclamationCircle } from 'react-icons/fa';

const AdminSettings = () => {
  const { user, refreshData } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    systemName: '',
    votingEnabled: true,
    maintenanceMode: false,
    votingWindowStart: '',
    votingWindowEnd: '',
    badgeEnabled: true,
    earlyVoterMinutes: 30
  });
  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [adminMsg, setAdminMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('system');

  const toLocalInput = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const toIsoString = (localValue) => {
    if (!localValue) return null;
    const date = new Date(localValue);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + tzOffset).toISOString();
  };

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    loadSettings();
  }, [user, navigate]);

  const loadSettings = () => {
    const currentSettings = getSettings();
    setSettings(currentSettings);
    setFormData({
      systemName: currentSettings.systemName || 'Reality Show Voting System',
      votingEnabled: currentSettings.votingEnabled !== false,
      maintenanceMode: currentSettings.maintenanceMode === true,
      votingWindowStart: toLocalInput(currentSettings.votingWindowStart),
      votingWindowEnd: toLocalInput(currentSettings.votingWindowEnd),
      badgeEnabled: currentSettings.badgeEnabled !== false,
      earlyVoterMinutes: currentSettings.earlyVoterMinutes || 30
    });
    if (currentSettings.logo) {
      setLogoPreview(currentSettings.logo);
    }
    
    setAdminData({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'earlyVoterMinutes' ? Number(value) : value)
    }));
  };

  const handleAdminInputChange = (e) => {
    const { name, value } = e.target;
    setAdminData(prev => ({ ...prev, [name]: value }));
  };

  const handleAdminUpdate = async (e) => {
    e.preventDefault();
    setAdminMsg({ type: '', text: '' });

    if (!adminData.name.trim()) {
      setAdminMsg({ type: 'error', text: 'Name is required' });
      return;
    }

    if (!adminData.email.trim()) {
      setAdminMsg({ type: 'error', text: 'Email is required' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminData.email)) {
      setAdminMsg({ type: 'error', text: 'Invalid email format' });
      return;
    }

    try {
      updateUser(user.id, {
        name: adminData.name.trim(),
        email: adminData.email.trim()
      });

      setAdminMsg({ type: 'success', text: 'Admin profile updated successfully!' });
      setTimeout(() => setAdminMsg({ type: '', text: '' }), 3000);
    } catch (error) {
      setAdminMsg({ type: 'error', text: 'Failed to update profile' });
    }
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    setAdminMsg({ type: '', text: '' });

    if (!adminData.currentPassword) {
      setAdminMsg({ type: 'error', text: 'Current password is required' });
      return;
    }

    if (adminData.currentPassword !== user.password) {
      setAdminMsg({ type: 'error', text: 'Current password is incorrect' });
      return;
    }

    if (!adminData.newPassword) {
      setAdminMsg({ type: 'error', text: 'New password is required' });
      return;
    }

    if (adminData.newPassword.length < 6) {
      setAdminMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    if (adminData.newPassword !== adminData.confirmPassword) {
      setAdminMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    try {
      updateUser(user.id, { password: adminData.newPassword });
      setAdminData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setAdminMsg({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => setAdminMsg({ type: '', text: '' }), 3000);
    } catch (error) {
      setAdminMsg({ type: 'error', text: 'Failed to update password' });
    }
  };

  const handleLogoSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const updated = updateSettings({
        systemName: formData.systemName.trim(),
        logo: logoPreview,
        votingEnabled: formData.votingEnabled,
        maintenanceMode: formData.maintenanceMode,
        votingWindowStart: toIsoString(formData.votingWindowStart),
        votingWindowEnd: toIsoString(formData.votingWindowEnd),
        badgeEnabled: formData.badgeEnabled,
        earlyVoterMinutes: Number(formData.earlyVoterMinutes) || 0
      });

      setSettings(updated);
      refreshData();
      
      addActivityLog({
        type: 'settings_updated',
        userId: user.id,
        action: 'System settings updated'
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <div style={{ width: '100%', maxWidth: '980px', margin: '0 auto 0 10px' }}>
        <h1 style={{ 
          fontSize: '2.1rem', 
          marginBottom: '22px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <FaCog /> Admin Settings
        </h1>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '22px',
          borderBottom: '2px solid #e0e0e0',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'system', label: 'System Settings', icon: <FaCog /> },
            { id: 'profile', label: 'Admin Profile', icon: <FaUser /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '9px 16px',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                border: 'none',
                borderRadius: '10px 10px 0 0',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '0.9rem',
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

        {/* System Settings Tab */}
        {activeTab === 'system' && (
        <>
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

        <form onSubmit={handleSubmit}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaCog /> General Settings
            </h2>

            {/* System Name */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                System Name *
              </label>
              <input
                type="text"
                name="systemName"
                value={formData.systemName}
                onChange={handleInputChange}
                required
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  background: '#f8f9fa',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea';
                  e.target.style.background = 'white';
                  e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0';
                  e.target.style.background = '#f8f9fa';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Logo Upload */}
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                System Logo
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                {logoPreview ? (
                  <div style={{ position: 'relative' }}>
                    <img
                      src={logoPreview}
                      alt="System Logo"
                      style={{
                        maxWidth: '200px',
                        maxHeight: '100px',
                        borderRadius: '10px',
                        border: '2px solid #e0e0e0'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.9rem'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{
                    width: '200px',
                    height: '100px',
                    border: '2px dashed #e0e0e0',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999',
                    fontSize: '0.9rem'
                  }}>
                    No logo uploaded
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
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
                    fontSize: '0.95rem',
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
                  <FaUpload /> {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#999' }}>
                Recommended size: 200x100px. Max file size: 5MB
              </p>
            </div>
          </div>

          {/* Voting Controls */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaToggleOn /> Voting Controls
            </h2>

            <div style={{ marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f9fa', borderRadius: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '1.1rem', fontWeight: 'bold' }}>Enable Voting</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    Allow users to cast votes in active contests
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                  <input
                    type="checkbox"
                    name="votingEnabled"
                    checked={formData.votingEnabled}
                    onChange={handleInputChange}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: formData.votingEnabled ? '#51cf66' : '#ccc',
                    borderRadius: '30px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '22px',
                      width: '22px',
                      left: '4px',
                      bottom: '4px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: formData.votingEnabled ? 'translateX(30px)' : 'translateX(0)'
                    }}></span>
                  </span>
                </label>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f9fa', borderRadius: '12px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px', fontSize: '1.1rem', fontWeight: 'bold' }}>Maintenance Mode</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                    Temporarily disable the system for maintenance
                  </p>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={formData.maintenanceMode}
                    onChange={handleInputChange}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: formData.maintenanceMode ? '#ff9800' : '#ccc',
                    borderRadius: '30px',
                    transition: '0.3s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '22px',
                      width: '22px',
                      left: '4px',
                      bottom: '4px',
                      background: 'white',
                      borderRadius: '50%',
                      transition: '0.3s',
                      transform: formData.maintenanceMode ? 'translateX(30px)' : 'translateX(0)'
                    }}></span>
                  </span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '25px', display: 'grid', gap: '15px', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Voting Start</label>
                <input
                  type="datetime-local"
                  name="votingWindowStart"
                  value={formData.votingWindowStart}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Voting End</label>
                <input
                  type="datetime-local"
                  name="votingWindowEnd"
                  value={formData.votingWindowEnd}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#333' }}>Early voter window (minutes)</label>
                <input
                  type="number"
                  min="1"
                  name="earlyVoterMinutes"
                  value={formData.earlyVoterMinutes}
                  onChange={handleInputChange}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '2px solid #e0e0e0' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, votingWindowStart: toLocalInput(new Date().toISOString()), votingWindowEnd: toLocalInput(new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()) }))}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Start now +2h
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, votingWindowEnd: toLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString()) }))}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#e2e8f0', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Extend 1h
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, votingWindowEnd: toLocalInput(new Date().toISOString()) }))}
                style={{ padding: '10px 16px', borderRadius: '10px', border: 'none', background: '#fed7d7', color: '#c53030', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Force close now
              </button>
            </div>
          </div>

          {/* Badge Controls */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaToggleOn /> Badge & Engagement
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px', fontSize: '1.1rem', fontWeight: 'bold' }}>Enable Badges</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
                  Allow gamified badges for users
                </p>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                <input
                  type="checkbox"
                  name="badgeEnabled"
                  checked={formData.badgeEnabled}
                  onChange={handleInputChange}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: formData.badgeEnabled ? '#51cf66' : '#ccc',
                  borderRadius: '30px',
                  transition: '0.3s'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '""',
                    height: '22px',
                    width: '22px',
                    left: '4px',
                    bottom: '4px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: '0.3s',
                    transform: formData.badgeEnabled ? 'translateX(30px)' : 'translateX(0)'
                  }}></span>
                </span>
              </label>
            </div>
            <p style={{ color: '#4a5568', fontSize: '0.95rem' }}>
              Badges available: First Vote, Early Voter (uses early window minutes), Profile Completed, Results Viewer.
            </p>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'right' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.98rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
              }}
            >
              <FaSave /> {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
        </>
        )}

        {/* Admin Profile Tab */}
        {activeTab === 'profile' && (
        <div>
          {adminMsg.text && (
            <div style={{
              padding: '15px 20px',
              borderRadius: '12px',
              marginBottom: '25px',
              background: adminMsg.type === 'success' ? '#51cf66' : '#ff6b6b',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {adminMsg.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
              {adminMsg.text}
            </div>
          )}

          {/* Profile Update Section */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            marginBottom: '30px'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaUser /> Profile Information
            </h2>

            <form onSubmit={handleAdminUpdate} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                  <FaUser style={{ marginRight: '8px' }} /> Admin Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={adminData.name}
                  onChange={handleAdminInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#f8f9fa',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                  <FaEnvelope style={{ marginRight: '8px' }} /> Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={adminData.email}
                  onChange={handleAdminInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#f8f9fa',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '14px 35px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
                }}
              >
                <FaSave /> Update Profile
              </button>
            </form>
          </div>

          {/* Password Update Section */}
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', fontSize: '1.35rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FaKey /> Change Password
            </h2>

            <form onSubmit={handlePasswordUpdate} style={{ maxWidth: '600px' }}>
              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  value={adminData.currentPassword}
                  onChange={handleAdminInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#f8f9fa',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={adminData.newPassword}
                  onChange={handleAdminInputChange}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#f8f9fa',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <small style={{ color: '#999', marginTop: '5px', display: 'block' }}>Minimum 6 characters</small>
              </div>

              <div style={{ marginBottom: '25px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333', fontSize: '1rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={adminData.confirmPassword}
                  onChange={handleAdminInputChange}
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    background: '#f8f9fa',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.background = 'white';
                    e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: '14px 35px',
                  background: 'linear-gradient(135deg, #11cdef 0%, #1171ef 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(17, 113, 239, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(17, 113, 239, 0.3)';
                }}
              >
                <FaSave /> Update Password
              </button>
            </form>
          </div>
        </div>
        )}
    </div>
  );
};

export default AdminSettings;
