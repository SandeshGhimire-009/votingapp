import { Navigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireApproved = false }) => {
  const { user, isAuthenticated, initialized } = useApp();

  // Wait for initialization to complete
  if (!initialized) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>;
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Check if user has admin role (for admin routes)
  if (requireAdmin && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Admin routes require approved admin account
  if (requireAdmin && user.accountStatus !== 'approved') {
    return <Navigate to="/" replace />;
  }

  // Allow admins to access user routes in a different browser/tab
  // This enables testing and simultaneous admin/user access
  // Commenting out the redirect to allow flexibility
  // if (!requireAdmin && user.isAdmin) {
  //   return <Navigate to="/admin/dashboard" replace />;
  // }

  // Check if user account is approved (for voting and sensitive operations)
  if (requireApproved && user.accountStatus !== 'approved') {
    return <Navigate to="/user/dashboard" replace />;
  }

  // Check if user account is suspended
  if (user.accountStatus === 'suspended') {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
