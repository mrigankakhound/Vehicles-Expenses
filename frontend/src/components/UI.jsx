import React from 'react';

export const LoadingSpinner = ({ text = 'Loading...' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5">
    <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }}></div>
    <p className="text-muted mb-0">{text}</p>
  </div>
);

export const EmptyState = ({ icon = 'bi-inbox', title = 'No records found', message = '', action }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
    <div
      className="d-flex align-items-center justify-content-center rounded-circle mb-3"
      style={{ width: 72, height: 72, background: '#eff6ff' }}
    >
      <i className={`bi ${icon}`} style={{ fontSize: '2rem', color: '#60a5fa' }}></i>
    </div>
    <h6 className="fw-semibold text-dark mb-1">{title}</h6>
    {message && <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>{message}</p>}
    {action && action}
  </div>
);

export const ErrorState = ({ message = 'Unable to load data. Please try again.', onRetry }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-center">
    <div
      className="d-flex align-items-center justify-content-center rounded-circle mb-3"
      style={{ width: 72, height: 72, background: '#fef2f2' }}
    >
      <i className="bi bi-exclamation-triangle" style={{ fontSize: '2rem', color: '#f87171' }}></i>
    </div>
    <h6 className="fw-semibold text-dark mb-1">Something went wrong</h6>
    <p className="text-muted mb-3" style={{ fontSize: '0.875rem' }}>{message}</p>
    {onRetry && (
      <button className="btn btn-outline-primary btn-sm" onClick={onRetry}>
        <i className="bi bi-arrow-clockwise me-1"></i> Try Again
      </button>
    )}
  </div>
);

export const PageCard = ({ title, subtitle, children, actions }) => (
  <div className="card border-0 shadow-sm">
    {(title || actions) && (
      <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3 px-4">
        <div>
          {title && <h5 className="mb-0 fw-bold text-dark">{title}</h5>}
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
        {actions && <div className="d-flex gap-2">{actions}</div>}
      </div>
    )}
    <div className="card-body p-4">{children}</div>
  </div>
);

export const SummaryCard = ({ label, value, icon, color = '#1e40af', bgColor = '#eff6ff', trend }) => (
  <div
    className="card border-0 shadow-sm h-100"
    style={{ borderLeft: `4px solid ${color}` }}
  >
    <div className="card-body d-flex align-items-center gap-3 p-3">
      <div
        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
        style={{ width: 48, height: 48, background: bgColor }}
      >
        <i className={`bi ${icon}`} style={{ fontSize: '1.4rem', color }}></i>
      </div>
      <div className="overflow-hidden">
        <div className="text-muted" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
          {label}
        </div>
        <div className="fw-bold text-dark" style={{ fontSize: '1.1rem', whiteSpace: 'nowrap' }}>{value}</div>
        {trend && <small className="text-muted">{trend}</small>}
      </div>
    </div>
  </div>
);

export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav>
      <ul className="pagination pagination-sm mb-0 justify-content-end">
        <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page - 1)}>
            <i className="bi bi-chevron-left"></i>
          </button>
        </li>
        {start > 1 && (
          <>
            <li className="page-item"><button className="page-link" onClick={() => onPageChange(1)}>1</button></li>
            {start > 2 && <li className="page-item disabled"><span className="page-link">…</span></li>}
          </>
        )}
        {pages.map((p) => (
          <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(p)}>{p}</button>
          </li>
        ))}
        {end < totalPages && (
          <>
            {end < totalPages - 1 && <li className="page-item disabled"><span className="page-link">…</span></li>}
            <li className="page-item"><button className="page-link" onClick={() => onPageChange(totalPages)}>{totalPages}</button></li>
          </>
        )}
        <li className={`page-item ${page >= totalPages ? 'disabled' : ''}`}>
          <button className="page-link" onClick={() => onPageChange(page + 1)}>
            <i className="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>
    </nav>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: { label: 'Active', cls: 'badge bg-success-subtle text-success' },
    INACTIVE: { label: 'Inactive', cls: 'badge bg-secondary-subtle text-secondary' },
    PAID: { label: 'Paid', cls: 'badge bg-success-subtle text-success' },
    UNPAID: { label: 'Unpaid', cls: 'badge bg-danger-subtle text-danger' },
  };
  const config = map[status] || { label: status, cls: 'badge bg-secondary' };
  return <span className={config.cls}>{config.label}</span>;
};
