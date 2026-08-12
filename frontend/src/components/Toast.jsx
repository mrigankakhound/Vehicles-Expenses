import React, { useEffect, useRef } from 'react';

let toastId = 0;
const toastQueue = [];
let renderFn = null;

export const toast = {
  success: (message) => addToast('success', message),
  error: (message) => addToast('danger', message),
  info: (message) => addToast('info', message),
  warning: (message) => addToast('warning', message),
};

function addToast(type, message) {
  const id = ++toastId;
  toastQueue.push({ id, type, message });
  if (renderFn) renderFn([...toastQueue]);
  setTimeout(() => {
    const idx = toastQueue.findIndex((t) => t.id === id);
    if (idx > -1) toastQueue.splice(idx, 1);
    if (renderFn) renderFn([...toastQueue]);
  }, 4000);
}

const ICONS = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', info: 'bi-info-circle-fill', warning: 'bi-exclamation-triangle-fill' };

export const ToastContainer = () => {
  const [toasts, setToasts] = React.useState([]);
  renderFn = setToasts;

  const dismiss = (id) => {
    const idx = toastQueue.findIndex((t) => t.id === id);
    if (idx > -1) toastQueue.splice(idx, 1);
    setToasts([...toastQueue]);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        minWidth: '300px',
        maxWidth: '400px',
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`alert alert-${t.type} d-flex align-items-start gap-2 mb-0 shadow`}
          style={{ fontSize: '0.875rem', animation: 'slideInRight 0.3s ease' }}
        >
          <i className={`bi ${ICONS[t.type]} mt-1 flex-shrink-0`}></i>
          <span className="flex-grow-1">{t.message}</span>
          <button className="btn-close btn-sm ms-auto" onClick={() => dismiss(t.id)}></button>
        </div>
      ))}
    </div>
  );
};
