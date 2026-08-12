import React from 'react';

const ConfirmDialog = ({ show, title, message, onConfirm, onCancel, confirmText = 'Delete', confirmVariant = 'danger', loading = false }) => {
  if (!show) return null;

  return (
    <div
      className="modal d-block"
      style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9990 }}
      onClick={onCancel}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <div className="d-flex align-items-center gap-2">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 40, height: 40, background: confirmVariant === 'danger' ? '#fee2e2' : '#fef3c7' }}
              >
                <i
                  className={`bi ${confirmVariant === 'danger' ? 'bi-trash' : 'bi-exclamation-triangle'}`}
                  style={{ color: confirmVariant === 'danger' ? '#dc2626' : '#d97706', fontSize: '1.1rem' }}
                ></i>
              </div>
              <h5 className="modal-title mb-0 fw-bold">{title || 'Confirm Action'}</h5>
            </div>
            <button className="btn-close" onClick={onCancel} disabled={loading}></button>
          </div>
          <div className="modal-body pt-2">
            <p className="text-muted mb-0" style={{ fontSize: '0.9rem' }}>{message}</p>
          </div>
          <div className="modal-footer border-0 pt-0">
            <button className="btn btn-light px-4" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button
              className={`btn btn-${confirmVariant} px-4`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
