import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../store/AppContext';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaTv, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const { login } = useContext(AppContext);
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email || !formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitError('');
    setLoading(true);
    
    try {
      const result = await login(formData.email.trim(), formData.password);
      
      setLoading(false);
      
      if (result.success && result.user) {
        // Redirect based on user role
        if (result.user.isAdmin) {
          navigate('/admin/dashboard');
        } else {
          // Redirect to dashboard - user can see pending approval message there
          navigate('/user/dashboard');
        }
      } else {
        setSubmitError(result.error || 'Invalid credentials');
      }
    } catch (error) {
      setLoading(false);
      setSubmitError('An error occurred. Please try again.');
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

      <div className="container" style={{ maxWidth: '420px', width: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '35px 30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 15px',
              fontSize: '1.8rem',
              color: 'white',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <FaTv />
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
              Welcome Back
            </h1>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: 0 }}>
              Sign in to continue your voting journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {submitError && (
              <div style={{
                padding: '12px 16px',
                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                color: 'white',
                borderRadius: '10px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                fontSize: '0.9rem'
              }}>
                <FaTimesCircle style={{ fontSize: '1rem', flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}
            
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="email" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.875rem'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <FaUser style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '0.95rem',
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
                    padding: '12px 16px 12px 40px',
                    border: `2px solid ${errors.email ? '#ff6b6b' : '#e0e0e0'}`,
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    background: '#f8f9fa',
                    color: '#333',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
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
              {errors.email && (
                <span style={{ 
                  color: '#ff6b6b', 
                  fontSize: '0.85rem', 
                  marginTop: '8px', 
                  display: 'block',
                  fontWeight: '500'
                }}>
                  {errors.email}
                </span>
              )}
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="password" style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.875rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FaLock style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999',
                  fontSize: '0.95rem',
                  zIndex: 1
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 40px',
                    border: `2px solid ${errors.password ? '#ff6b6b' : '#e0e0e0'}`,
                    borderRadius: '10px',
                    fontSize: '0.95rem',
                    background: '#f8f9fa',
                    color: '#333',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box'
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
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#999',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#667eea'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <span style={{ 
                  color: '#ff6b6b', 
                  fontSize: '0.85rem', 
                  marginTop: '8px', 
                  display: 'block',
                  fontWeight: '500'
                }}>
                  {errors.password}
                </span>
              )}
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading 
                  ? '#ccc' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
                marginBottom: '24px',
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
                  Signing In...
                </>
              ) : (
                <>
                  <FaCheckCircle style={{ fontSize: '1.2rem' }} />
                  Sign In
                </>
              )}
            </button>
          </form>
          
          <div style={{ 
            textAlign: 'center', 
            paddingTop: '20px',
            borderTop: '1px solid #e0e0e0'
          }}>
            <p style={{ color: '#666', marginBottom: '12px', fontSize: '0.875rem' }}>
              Don't have an account?
            </p>
            <Link 
              to="/register" 
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontWeight: 'bold',
                fontSize: '0.95rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'rgba(102, 126, 234, 0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)';
                e.currentTarget.style.transform = 'translateX(5px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              Create Account →
            </Link>
          </div>

          {/* Footer Links */}
          <div style={{
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'center',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <Link to="/about" style={{ color: '#999', textDecoration: 'none', fontSize: '0.8rem' }}>
              About
            </Link>
            <Link to="/rules" style={{ color: '#999', textDecoration: 'none', fontSize: '0.8rem' }}>
              Rules
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        @keyframes float {
          from { transform: translate(0, 0) rotate(0deg); }
          to { transform: translate(-50px, -50px) rotate(360deg); }
        }
      `}</style>
    </section>
  );
};

export default Login;

