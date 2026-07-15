import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';

const UserLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const location = useLocation();

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    // Don't scroll to top on route change
    useEffect(() => {
        // Optionally scroll to top only for specific routes
        // window.scrollTo(0, 0);
    }, [location.pathname]);

    return (
        <div className="app-user-layout" style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9' }}>
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

            <div style={{
                flex: 1,
                marginLeft: sidebarOpen ? '280px' : '90px',
                transition: 'margin-left 0.3s ease',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <main className="app-user-main app-compact-main" style={{ padding: '22px', flex: 1, background: '#f7fafc' }}>
                    <div className="page-content-compact">
                        <Outlet key={location.pathname} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserLayout;
