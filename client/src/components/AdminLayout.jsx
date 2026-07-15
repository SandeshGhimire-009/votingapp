import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { FaTv, FaUsers, FaVoteYea, FaTrophy, FaClipboardList, FaCog, FaBars, FaSignOutAlt, FaUserPlus } from 'react-icons/fa';

const AdminLayout = () => {
    const { user, logout } = useApp();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { path: '/admin/dashboard', name: 'Dashboard', icon: <FaTv /> },
        { path: '/admin/users', name: 'Users', icon: <FaUsers /> },
        { path: '/admin/contests', name: 'Contests', icon: <FaVoteYea /> },
        { path: '/admin/contestant-requests', name: 'Contestant Requests', icon: <FaUserPlus /> },
        { path: '/admin/results', name: 'Results', icon: <FaTrophy /> },
        { path: '/admin/logs', name: 'Logs', icon: <FaClipboardList /> },
        { path: '/admin/settings', name: 'Settings', icon: <FaCog /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="app-admin-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f8f9fa' }}>
            {/* Sidebar */}
            <aside
                style={{
                    width: sidebarOpen ? '280px' : '90px',
                    background: '#ffffff',
                    borderRight: '2px solid #d0d0d0',
                    height: '100vh',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    transition: 'width 0.3s ease',
                    zIndex: 1000,
                    overflowX: 'hidden',
                    boxShadow: '4px 0 15px rgba(0,0,0,0.12)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: sidebarOpen ? 'space-between' : 'center',
                    borderBottom: '2px solid #e8e8e8',
                    minHeight: '50px',
                    background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
                }}>
                    {sidebarOpen && (
                        <h2 style={{
                            margin: 0,
                            fontSize: '1.1rem',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap'
                        }}>
                            Admin Panel
                        </h2>
                    )}
                    <div
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        style={{
                            cursor: 'pointer',
                            fontSize: '1.3rem',
                            color: '#667eea',
                            padding: '10px',
                            borderRadius: '10px',
                            background: 'rgba(102, 126, 234, 0.1)',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(102, 126, 234, 0.2)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'}
                    >
                        <FaBars />
                    </div>
                </div>

                <nav style={{ marginTop: '20px', flex: 1, padding: '0 16px', overflowY: 'auto' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {menuItems.map((item) => (
                            <li key={item.path}>
                                <NavLink
                                    to={item.path}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        color: isActive ? '#fff' : '#4a5568',
                                        textDecoration: 'none',
                                        background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(102, 126, 234, 0.05)',
                                        borderRadius: '12px',
                                        transition: 'all 0.3s ease',
                                        fontWeight: isActive ? 'bold' : 'normal',
                                        gap: '15px',
                                        boxShadow: isActive ? '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
                                    })}
                                    onMouseEnter={(e) => {
                                        if (!e.currentTarget.classList.contains('active')) {
                                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                            e.currentTarget.style.transform = 'translateX(5px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!e.currentTarget.classList.contains('active')) {
                                            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                                    {sidebarOpen && <span>{item.name}</span>}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                <div style={{ padding: '16px', borderTop: '2px solid #e8e8e8' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff5252 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: sidebarOpen ? 'flex-start' : 'center',
                            gap: '15px',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 107, 107, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 107, 107, 0.3)';
                        }}
                    >
                        <FaSignOutAlt style={{ fontSize: '1.3rem' }} />
                        {sidebarOpen && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="app-admin-main app-compact-main" style={{
                marginLeft: sidebarOpen ? '280px' : '90px',
                flex: 1,
                padding: '22px',
                transition: 'margin-left 0.3s ease',
                minHeight: '100vh',
                width: '100%'
            }}>
                <div className="page-content-compact">
                    <Outlet key={location.pathname} />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
