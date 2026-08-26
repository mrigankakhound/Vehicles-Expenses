import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const breadcrumbMap = {
  '/': 'Dashboard',
  '/vehicles': 'Vehicles',
  '/vehicles/new': 'Add Vehicle',
  '/expenses': 'All Expenses',
  '/expenses/washing': 'Washing Expenses',
  '/expenses/fuel': 'Fuel Expenses',
  '/expenses/service': 'Vehicle Service Expenses',
  '/expenses/office': 'Office Expenses',
  '/parties': 'Parties / Vendors',
  '/revenue': 'Vehicle Revenue',
  '/reports/monthly': 'Monthly Report',
  '/reports/yearly': 'Yearly Report',
  '/reports/vehicle-expense': 'Vehicle Expense Report',
  '/reports/profitability': 'Vehicle Profitability',
  '/import-export': 'Import / Export',
  '/settings': 'Settings',
};

const Topbar = ({ collapsed, onMobileMenuToggle }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getTitle = () => {
    const match = Object.keys(breadcrumbMap)
      .sort((a, b) => b.length - a.length)
      .find((k) => location.pathname === k || location.pathname.startsWith(k + '/'));
    return breadcrumbMap[match] || 'FleetCost';
  };

  return (
    <header
      className="d-flex align-items-center justify-content-between border-bottom"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        left: isMobile ? '0' : (collapsed ? '64px' : '240px'),
        height: '60px',
        background: '#ffffff',
        zIndex: 900,
        transition: 'left 0.3s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: isMobile ? '0 12px' : '0 24px',
      }}
    >
      <div className="d-flex align-items-center gap-2">
        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            className="btn btn-link p-0 text-dark"
            onClick={onMobileMenuToggle}
            style={{ fontSize: '1.3rem', lineHeight: 1, textDecoration: 'none' }}
            aria-label="Open menu"
          >
            <i className="bi bi-list"></i>
          </button>
        )}
        <div>
          <h6 className="mb-0 fw-bold text-dark" style={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>{getTitle()}</h6>
          {!isMobile && (
            <small className="text-muted" style={{ fontSize: '0.72rem' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </small>
          )}
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <div
          className="d-flex align-items-center gap-2 rounded-pill px-2 py-1"
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 28, height: 28, background: '#1e40af', flexShrink: 0 }}
          >
            <i className="bi bi-person text-white" style={{ fontSize: '0.85rem' }}></i>
          </div>
          {!isMobile && (
            <span className="fw-semibold text-primary" style={{ fontSize: '0.82rem' }}>{user?.username}</span>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
