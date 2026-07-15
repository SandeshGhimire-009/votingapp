import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';

const Logout = () => {
  const { logout } = useApp();
  const navigate = useNavigate();

  React.useEffect(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <div className="logout-container">
      <p>Logging out...</p>
    </div>
  );
};

export default Logout;
