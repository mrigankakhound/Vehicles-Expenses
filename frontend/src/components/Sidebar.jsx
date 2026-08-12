import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    label: 'Dashboard',
    icon: 'bi-speedometer2',
    path: '/',
    exact: true,
  },
  {
    label: 'Vehicles',
    icon: 'bi-car-front',
    children: [
      { label: 'Vehicle List', path: '/vehicles' },
      { label: 'Add Vehicle', path: '/vehicles/new' },
    ],
  },
  {
    label: 'Expenses',
    icon: 'bi-receipt',
    children: [
      { label: 'All Expenses', path: '/expenses' },
      { label: 'Washing', path: '/expenses/washing' },
      { label: 'Fuel', path: '/expenses/fuel' },
      { label: 'Vehicle Service', path: '/expenses/service' },
      { label: 'Office Expenses', path: '/expenses/office' },
    ],
  },
  {
    label: 'Reports',
    icon: 'bi-bar-chart-line',
    children: [
      { label: 'Monthly Report', path: '/reports/monthly' },
      { label: 'Yearly Report', path: '/reports/yearly' },
      { label: 'Vehicle Expense', path: '/reports/vehicle-expense' },
      { label: 'Profitability', path: '/reports/profitability' },
    ],
  },
  {
    label: 'Parties / Vendors',
    icon: 'bi-people',
    path: '/parties',
  },
  {
    label: 'Revenue',
    icon: 'bi-cash-stack',
    path: '/revenue',
  },
  {
    label: 'Import / Export',
    icon: 'bi-arrow-left-right',
    path: '/import-export',
  },
  {
    label: 'Settings',
    icon: 'bi-gear',
    path: '/settings',
  },
];

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState({});

  useEffect(() => {
    // Auto-open the menu containing the current path
    navItems.forEach((item, idx) => {
      if (item.children) {
        const isActive = item.children.some((c) => location.pathname.startsWith(c.path));
        if (isActive) {
          setOpenMenus((prev) => ({ ...prev, [idx]: true }));
        }
      }
    });
  }, [location.pathname]);

  const toggleMenu = (idx) => {
    setOpenMenus((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className="sidebar d-flex flex-column"
      style={{
        width: collapsed ? '64px' : '240px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 40%, #1d4ed8 100%)',
        transition: 'width 0.3s ease',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1000,
        overflowX: 'hidden',
        boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
      }}
    >
      {/* Header */}
      <div className="d-flex align-items-center px-3 py-3 border-bottom border-primary border-opacity-25">
        <div
          className="d-flex align-items-center justify-content-center rounded-2"
          style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', flexShrink: 0 }}
        >
          <i className="bi bi-truck text-white" style={{ fontSize: '1.1rem' }}></i>
        </div>
        {!collapsed && (
          <div className="ms-2 overflow-hidden">
            <div className="text-white fw-bold" style={{ fontSize: '1rem', whiteSpace: 'nowrap' }}>FleetCost</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}>Vehicle Management</div>
          </div>
        )}
        <button
          className="btn btn-link text-white ms-auto p-0"
          onClick={onToggle}
          style={{ flexShrink: 0 }}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 py-2" style={{ overflowY: 'auto', overflowX: 'hidden' }}>
        {navItems.map((item, idx) => {
          if (item.children) {
            const anyChildActive = item.children.some((c) => isActive(c.path));
            const isOpen = openMenus[idx];
            return (
              <div key={idx}>
                <button
                  className={`sidebar-nav-item w-100 d-flex align-items-center px-3 py-2 border-0 text-start ${anyChildActive ? 'sidebar-nav-active' : ''}`}
                  onClick={() => toggleMenu(idx)}
                  style={{
                    background: anyChildActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: 'rgba(255,255,255,0.85)',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    gap: '10px',
                  }}
                >
                  <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem', flexShrink: 0, width: 20, textAlign: 'center' }}></i>
                  {!collapsed && (
                    <>
                      <span style={{ flexGrow: 1, fontSize: '0.875rem', whiteSpace: 'nowrap' }}>{item.label}</span>
                      <i className={`bi ${isOpen ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: '0.7rem' }}></i>
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div style={{ background: 'rgba(0,0,0,0.15)' }}>
                    {item.children.map((child) => (
                      <Link
                        key={child.path}
                        to={child.path}
                        className="d-flex align-items-center px-3 py-2 text-decoration-none"
                        style={{
                          paddingLeft: '52px !important',
                          background: isActive(child.path) ? 'rgba(255,255,255,0.2)' : 'transparent',
                          color: isActive(child.path) ? '#ffffff' : 'rgba(255,255,255,0.7)',
                          fontSize: '0.82rem',
                          paddingLeft: '52px',
                          borderLeft: isActive(child.path) ? '3px solid #60a5fa' : '3px solid transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <i className="bi bi-dot me-1"></i>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={idx}
              to={item.path}
              className="sidebar-nav-item d-flex align-items-center px-3 py-2 text-decoration-none"
              style={{
                background: isActive(item.path, item.exact) ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: isActive(item.path, item.exact) ? '#ffffff' : 'rgba(255,255,255,0.8)',
                borderLeft: isActive(item.path, item.exact) ? '3px solid #60a5fa' : '3px solid transparent',
                gap: '10px',
                transition: 'all 0.2s',
                fontSize: '0.875rem',
              }}
            >
              <i className={`bi ${item.icon}`} style={{ fontSize: '1.1rem', flexShrink: 0, width: 20, textAlign: 'center' }}></i>
              {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="border-top border-primary border-opacity-25 px-3 py-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', flexShrink: 0 }}
          >
            <i className="bi bi-person text-white" style={{ fontSize: '0.9rem' }}></i>
          </div>
          {!collapsed && (
            <div className="flex-grow-1 overflow-hidden">
              <div className="text-white fw-semibold" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{user?.username}</div>
              <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>Administrator</div>
            </div>
          )}
          <button
            className="btn btn-link p-0 text-white"
            onClick={handleLogout}
            title="Logout"
            style={{ flexShrink: 0 }}
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
