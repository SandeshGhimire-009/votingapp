import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaTv, FaChartBar, FaUser, FaClipboardList, FaHistory, FaBell, FaBars, FaSignOutAlt, FaVoteYea, FaHome } from 'react-icons/fa';
import { useApp } from '../store/AppContext';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout, contests } = useApp();
    const navigate = useNavigate();
    const hasPublishedResults = contests.some(contest => contest.resultsPublished !== false || contest.status === 'closed' || contest.status === 'active');

    const menuItems = [
        { path: '/user/dashboard', name: 'Dashboard', icon: <FaTv /> },
        { path: '/user/vote', name: 'Vote', icon: <FaVoteYea /> },
        { path: '/user/requests', name: 'My Applications', icon: <FaClipboardList /> },
        ...(hasPublishedResults ? [{ path: '/user/results', name: 'Results', icon: <FaChartBar /> }] : []),
        { path: '/user/activity', name: 'My Activity', icon: <FaHistory /> },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <aside
            style={{
                width: isOpen ? '280px' : '90px',
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
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '2px solid #e8e8e8',
                minHeight: '58px',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)',
                position: 'relative'
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: isOpen ? '1rem' : '0.92rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: isOpen ? '-0.3px' : '0',
                    whiteSpace: 'nowrap',
                    textAlign: 'center',
                    maxWidth: isOpen ? '185px' : '100%'
                }}>
                    {isOpen ? 'Reality Vote' : 'RV'}
                </h2>
                <div
                    onClick={toggleSidebar}
                    style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        color: '#667eea',
                        padding: '8px',
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
                                end={item.path === '/user/dashboard'}
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
                                onClick={(e) => {
                                    // Let React Router handle navigation
                                    // No preventDefault needed as NavLink handles it
                                }}
                                onMouseEnter={(e) => {
                                    const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                                        e.currentTarget.style.transform = 'translateX(5px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }
                                }}
                            >
                                <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                                {isOpen && <span>{item.name}</span>}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div style={{
                borderTop: '2px solid #e8e8e8',
                padding: '16px',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #ffffff 100%)'
            }}>
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
                        justifyContent: isOpen ? 'flex-start' : 'center',
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
                    {isOpen && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
