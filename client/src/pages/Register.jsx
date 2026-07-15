import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { FaUser, FaLock, FaEnvelope, FaPhone, FaEye, FaEyeSlash, FaTv, FaCheckCircle, FaTimesCircle, FaArrowLeft, FaUserTie } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    profilePicture: null
  });
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const { register } = useApp();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    setSubmitError('');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, profilePicture: 'Please upload an image file' }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, profilePicture: 'Image must be less than 5MB' }));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profilePicture: reader.result }));
      setErrors(prev => ({ ...prev, profilePicture: '' }));
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email || formData.email.trim() === '') {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.phoneNumber && !/^\+?[\d\s-]{10,}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.profilePicture) {
      newErrors.profilePicture = 'Profile photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitError('');
    setSubmitSuccess('');
    setLoading(true);

    try {
      const result = await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phoneNumber: formData.phoneNumber.trim(),
        password: formData.password,
        role: formData.role,
        profilePicture: formData.profilePicture
      });

      setLoading(false);

      if (result.success && result.user) {
        setSubmitSuccess(`Account created successfully! ${result.user.accountStatus === 'pending' ? 'Your account is pending approval.' : 'You can now log in.'}`);

        setTimeout(() => {
          if (result.user.isAdmin && result.user.accountStatus === 'approved') {
            navigate('/admin/dashboard');
          } else if (result.user.isAdmin) {
            navigate('/', {
              state: {
                message: 'Admin registration submitted. Please wait for admin approval before logging in.'
              }
            });
          } else {
            navigate('/user/dashboard', {
              state: {
                message: result.user.accountStatus === 'pending'
                  ? 'Your account is pending admin approval. You will be notified once approved.'
                  : 'Welcome! Your account has been created successfully.'
              }
            });
          }
        }, 2000);
      } else {
        setSubmitError(result.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      setSubmitError(error?.message || 'An error occurred. Please try again.');
      console.error('Registration error:', error);
    }
  };

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, var(--bg-top), var(--bg-bot))',
      padding: '40px 20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(118, 75, 162, 0.03) 0%, transparent 50%)`,
        pointerEvents: 'none'
      }}></div>

      <div className="container" style={{ maxWidth: '480px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '22px',
          padding: '40px 34px',
          boxShadow: '0 10px 36px rgba(0,0,0,0.14)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#667eea',
              textDecoration: 'none',
              marginBottom: '20px',
              fontSize: '0.95rem',
              fontWeight: '500'
            }}
          >
            <FaArrowLeft /> Back to Login
          </Link>

          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: formData.profilePicture
                ? `url(${formData.profilePicture}) center/cover no-repeat`
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '1.8rem',
              color: 'white',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              {!formData.profilePicture && <FaTv />}
            </div>
            <h1 style={{
              fontSize: '1.8rem',
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              letterSpacing: '-0.5px'
            }}>
              Create Account
            </h1>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
              Join the reality show voting platform
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {submitError && (
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                color: 'white',
                borderRadius: '12px',
                marginBottom: '25px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaTimesCircle /> {submitError}
              </div>
            )}

            {submitSuccess && (
              <div style={{
                padding: '15px 20px',
                background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
                color: 'white',
                borderRadius: '12px',
                marginBottom: '25px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FaCheckCircle /> {submitSuccess}
              </div>
            )}

            {/* Role Selection */}
            <div style={{ marginBottom: '25px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Account Type *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div
                  onClick={() => setFormData(prev => ({ ...prev, role: 'user' }))}
                  style={{
                    padding: '20px',
                    border: `3px solid ${formData.role === 'user' ? '#667eea' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    background: formData.role === 'user' ? 'rgba(102, 126, 234, 0.1)' : '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.role !== 'user') {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.role !== 'user') {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                >
                  <FaUser style={{ fontSize: '2rem', color: formData.role === 'user' ? '#667eea' : '#999', marginBottom: '10px' }} />
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>User</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>Vote & Participate</div>
                </div>
                <div
                  onClick={() => setFormData(prev => ({ ...prev, role: 'admin' }))}
                  style={{
                    padding: '20px',
                    border: `3px solid ${formData.role === 'admin' ? '#667eea' : '#e0e0e0'}`,
                    borderRadius: '12px',
                    background: formData.role === 'admin' ? 'rgba(102, 126, 234, 0.1)' : '#f8f9fa',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (formData.role !== 'admin') {
                      e.currentTarget.style.borderColor = '#667eea';
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (formData.role !== 'admin') {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.background = '#f8f9fa';
                    }
                  }}
                >
                  <FaUserTie style={{ fontSize: '2rem', color: formData.role === 'admin' ? '#667eea' : '#999', marginBottom: '10px' }} />
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '5px' }}>Admin</div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>Manage System</div>
                </div>
              </div>
              {formData.role === 'admin' && (
                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: '#ff9800', fontWeight: '500' }}>
                  ⚠️ Admin accounts require approval by an existing admin
                </p>
              )}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="profilePicture" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333'
              }}>
                Profile Photo *
              </label>
              <input
                type="file"
                id="profilePicture"
                name="profilePicture"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `2px solid ${errors.profilePicture ? '#ff6b6b' : '#e0e0e0'}`,
                  borderRadius: '12px',
                  background: '#f8f9fa'
                }}
              />
              <div style={{ fontSize: '0.82rem', color: '#666', marginTop: '8px' }}>
                Uploading profile photo here will also show it in candidate apply/re-apply and admin views.
              </div>
              {errors.profilePicture && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>{errors.profilePicture}</span>}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="name" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333'
              }}>
                Full Name *
              </label>
              <div style={{ position: 'relative' }}>
                <FaUser style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '1.1rem',
                  zIndex: 1
                }} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px 16px 50px',
                    border: `2px solid ${errors.name ? '#ff6b6b' : '#e0e0e0'}`,
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
                    e.target.style.borderColor = errors.name ? '#ff6b6b' : '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.name && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>{errors.name}</span>}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="email" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333'
              }}>
                Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <FaEnvelope style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '1.1rem',
                  zIndex: 1
                }} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your.email@example.com"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 20px 16px 50px',
                    border: `2px solid ${errors.email ? '#ff6b6b' : '#e0e0e0'}`,
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
                    e.target.style.borderColor = errors.email ? '#ff6b6b' : '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.email && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>{errors.email}</span>}
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="phoneNumber" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333'
              }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <FaPhone style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '1.1rem',
                  zIndex: 1
                }} />
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1234567890 (optional)"
                  style={{
                    width: '100%',
                    padding: '16px 20px 16px 50px',
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
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label htmlFor="password" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333'
              }}>
                Password *
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '1.1rem',
                  zIndex: 1
                }} />
                <input
                  type={showPassword.password ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 50px',
                    border: `2px solid ${errors.password ? '#ff6b6b' : '#e0e0e0'}`,
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
                    e.target.style.borderColor = errors.password ? '#ff6b6b' : '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, password: !prev.password }))}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '8px'
                  }}
                >
                  {showPassword.password ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>{errors.password}</span>}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label htmlFor="confirmPassword" style={{
                display: 'block',
                marginBottom: '10px',
                fontWeight: '600',
                color: '#333'
              }}>
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '1.1rem',
                  zIndex: 1
                }} />
                <input
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  minLength={6}
                  style={{
                    width: '100%',
                    padding: '16px 50px 16px 50px',
                    border: `2px solid ${errors.confirmPassword ? '#ff6b6b' : '#e0e0e0'}`,
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
                    e.target.style.borderColor = errors.confirmPassword ? '#ff6b6b' : '#e0e0e0';
                    e.target.style.background = '#f8f9fa';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => ({ ...prev, confirmPassword: !prev.confirmPassword }))}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '8px'
                  }}
                >
                  {showPassword.confirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && <span style={{ color: '#ff6b6b', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>{errors.confirmPassword}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '18px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 10px 30px rgba(102, 126, 234, 0.4)',
                marginBottom: '25px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = loading ? 'none' : '0 10px 30px rgba(102, 126, 234, 0.4)';
              }}
            >
              {loading ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '3px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}></div>
                  Creating Account...
                </>
              ) : (
                <>
                  <FaCheckCircle /> Create Account
                </>
              )}
            </button>
          </form>

          <div style={{
            textAlign: 'center',
            paddingTop: '25px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.95rem' }}>
              Already have an account?
            </p>
            <Link
              to="/"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                background: 'rgba(102, 126, 234, 0.1)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'translateX(-5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <FaArrowLeft /> Sign In
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes float {
          from { transform: translate(0, 0) rotate(0deg); }
          to { transform: translate(-50px, -50px) rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Register;
