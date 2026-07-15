import React, { useEffect } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import Navbar from '../components/Navbar';
import LoginNavbar from '../components/LoginNavbar';

const Rootlayout = () => {
  const { isAuthenticated, initialized, user } = useApp();
  const location = useLocation();

  // Don't render anything until initialization is complete
  if (!initialized) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--bg)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '1rem',
            color: 'var(--text)',
            opacity: 0.6
          }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  // Determine which navbar to show
  const publicRoutes = ['/', '/register', '/about', '/rules'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  const showLoginNavbar = !isAuthenticated && isPublicRoute;

  // If user is authenticated and on login/register, redirect to dashboard
  if (isAuthenticated && user && (location.pathname === '/' || location.pathname === '/register')) {
    return <Navigate to={user.isAdmin ? '/admin/dashboard' : '/user/dashboard'} replace />;
  }

  return (
    <div className="root-layout">
      {showLoginNavbar ? <LoginNavbar /> : <Navbar />}
      <main className="main-content">
        <Outlet />
      </main>
      <footer style={{
        marginTop: '60px',
        padding: '30px 20px',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        textAlign: 'center',
        color: 'var(--muted)'
      }}>
        <p style={{ margin: 0 }}>&copy; 2024 Reality Show Voting System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Rootlayout;
