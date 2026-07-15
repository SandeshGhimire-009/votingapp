import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getSettings, updateSettings } from '../utils/storage';
import { FaTv, FaMoon, FaSun } from 'react-icons/fa';

const LoginNavbar = () => {
  const [theme, setTheme] = useState(() => getSettings()?.theme || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    updateSettings({ theme });
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'var(--surface)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px'
      }}>
        <Link 
          to="/" 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            color: 'var(--text)',
            fontWeight: 'bold',
            fontSize: '1.3rem'
          }}
        >
          <FaTv style={{ 
            fontSize: '1.8rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }} />
          <span style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Reality Show Voting
          </span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '10px 14px',
              cursor: 'pointer',
              color: 'var(--text)',
              fontSize: '1.2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.borderColor = 'var(--accent-1)';
              e.currentTarget.style.transform = 'rotate(15deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.transform = 'rotate(0deg)';
            }}
          >
            {theme === 'light' ? <FaMoon /> : <FaSun />}
          </button>

          <Link 
            to="/" 
            className="btn"
            style={{
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface-2)';
              e.currentTarget.style.borderColor = 'var(--accent-1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className="btn btn-primary"
            style={{
              padding: '10px 20px',
              textDecoration: 'none',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default LoginNavbar;
