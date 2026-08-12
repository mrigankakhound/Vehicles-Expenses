import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="d-flex" style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div
        style={{
          marginLeft: collapsed ? '64px' : '240px',
          transition: 'margin-left 0.3s ease',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Topbar collapsed={collapsed} />
        <main style={{ flex: 1, padding: '24px', paddingTop: '80px' }}>
          <Outlet />
        </main>
        <footer
          className="text-center py-2 border-top"
          style={{ fontSize: '0.75rem', color: '#94a3b8', background: '#fff' }}
        >
          FleetCost &copy; {new Date().getFullYear()} — Vehicle Expense & Profitability Management System
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
