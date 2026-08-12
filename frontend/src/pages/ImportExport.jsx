import React, { useState, useRef } from 'react';
import api from '../services/api';
import { getErrorMessage } from '../utils/helpers';
import { PageCard } from '../components/UI';
import { toast } from '../components/Toast';

const ImportExport = () => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importErrors, setImportErrors] = useState([]);
  const fileInputRef = useRef();

  const handleTemplateDownload = () => {
    const token = localStorage.getItem('fleetcost_token');
    const a = document.createElement('a');
    a.href = `${import.meta.env.VITE_API_URL}/export/template?token=${token}`;
    a.click();
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setImportResult(null);
      setImportErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) { toast.error('Please select an Excel file first.'); return; }
    setImporting(true);
    setImportResult(null);
    setImportErrors([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/import/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult({ success: true, count: res.data.data.importedCount, message: res.data.message });
      toast.success(res.data.message);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      const errData = err?.response?.data;
      if (errData?.data?.errors) {
        setImportErrors(errData.data.errors);
        setImportResult({ success: false, message: errData.message });
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="row g-4">
      {/* Import */}
      <div className="col-lg-6">
        <PageCard title="Import Expenses" subtitle="Import historical expense data from Excel">
          <div className="mb-3 p-3 rounded-2" style={{ background: '#eff6ff' }}>
            <h6 className="fw-bold mb-2"><i className="bi bi-info-circle me-2 text-primary"></i>Before Importing</h6>
            <ol className="mb-0 ps-3" style={{ fontSize: '0.85rem', color: '#374151' }}>
              <li>Download the import template below</li>
              <li>Fill in your expense data using the template format</li>
              <li>Ensure all vehicle numbers exist in the system</li>
              <li>Use correct values for Expense Type, MOP, and Payment Status</li>
              <li>Upload and validate before importing</li>
            </ol>
          </div>

          <button className="btn btn-outline-primary btn-sm mb-4" onClick={handleTemplateDownload}>
            <i className="bi bi-download me-2"></i>Download Import Template (Excel)
          </button>

          <div className="mb-3">
            <label className="form-label fw-semibold">Select Excel File</label>
            <input
              type="file"
              className="form-control"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <div className="form-text">Only .xlsx and .xls files are accepted. Maximum 10MB.</div>
          </div>

          {file && (
            <div className="alert alert-light d-flex align-items-center gap-2 py-2 mb-3" style={{ fontSize: '0.82rem' }}>
              <i className="bi bi-file-earmark-excel text-success"></i>
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}

          <button
            className="btn btn-primary w-100"
            onClick={handleImport}
            disabled={importing || !file}
          >
            {importing ? (
              <><span className="spinner-border spinner-border-sm me-2"></span>Importing & Validating...</>
            ) : (
              <><i className="bi bi-upload me-2"></i>Import Expenses</>
            )}
          </button>

          {/* Import result */}
          {importResult?.success && (
            <div className="alert alert-success d-flex align-items-center gap-2 mt-3" style={{ fontSize: '0.875rem' }}>
              <i className="bi bi-check-circle-fill"></i>
              <span>{importResult.message}</span>
            </div>
          )}

          {/* Import errors */}
          {importErrors.length > 0 && (
            <div className="mt-3">
              <div className="alert alert-danger py-2 mb-2" style={{ fontSize: '0.875rem' }}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                <strong>Import Failed:</strong> {importResult?.message}
              </div>
              <div className="rounded-2 border border-danger-subtle overflow-hidden" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {importErrors.map((e) => (
                  <div key={e.row} className="px-3 py-2 border-bottom" style={{ fontSize: '0.82rem', background: '#fef2f2' }}>
                    <strong>Row {e.row}:</strong>
                    <ul className="mb-0 ps-3 mt-1">
                      {e.errors.map((msg, i) => <li key={i} className="text-danger">{msg}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                Fix the errors above and re-upload. No data was imported due to validation errors.
              </p>
            </div>
          )}
        </PageCard>
      </div>

      {/* Export */}
      <div className="col-lg-6">
        <PageCard title="Export Data" subtitle="Download expense data and reports">
          <div className="d-flex flex-column gap-3">
            {[
              { label: 'All Expenses (Excel)', icon: 'bi-file-earmark-excel', color: '#16a34a', desc: 'Export all expense records with current filters', url: '/export/expenses' },
              { label: 'Monthly Report (Excel)', icon: 'bi-file-earmark-excel', color: '#16a34a', desc: 'Go to Monthly Report to export with month/year', path: '/reports/monthly' },
              { label: 'Yearly Report (Excel)', icon: 'bi-file-earmark-excel', color: '#16a34a', desc: 'Go to Yearly Report to export with year selection', path: '/reports/yearly' },
              { label: 'Profitability Report (Excel)', icon: 'bi-file-earmark-excel', color: '#16a34a', desc: 'Go to Profitability Report to export', path: '/reports/profitability' },
              { label: 'Monthly Report (PDF)', icon: 'bi-file-earmark-pdf', color: '#dc2626', desc: 'Go to Monthly Report to generate PDF', path: '/reports/monthly' },
              { label: 'Yearly Report (PDF)', icon: 'bi-file-earmark-pdf', color: '#dc2626', desc: 'Go to Yearly Report to generate PDF', path: '/reports/yearly' },
              { label: 'Profitability Report (PDF)', icon: 'bi-file-earmark-pdf', color: '#dc2626', desc: 'Go to Profitability Report to generate PDF', path: '/reports/profitability' },
            ].map((item, idx) => (
              <div key={idx} className="d-flex align-items-center gap-3 p-3 rounded-2 border" style={{ background: '#f8fafc' }}>
                <div className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0" style={{ width: 40, height: 40, background: `${item.color}15` }}>
                  <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: '1.2rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold" style={{ fontSize: '0.875rem' }}>{item.label}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</div>
                </div>
                {item.url ? (
                  <button
                    className="btn btn-sm btn-outline-secondary flex-shrink-0"
                    onClick={() => {
                      const token = localStorage.getItem('fleetcost_token');
                      const a = document.createElement('a');
                      a.href = `${import.meta.env.VITE_API_URL}${item.url}?token=${token}`;
                      a.click();
                    }}
                  >
                    <i className="bi bi-download"></i>
                  </button>
                ) : (
                  <a href={item.path} className="btn btn-sm btn-outline-primary flex-shrink-0">
                    <i className="bi bi-arrow-right"></i>
                  </a>
                )}
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  );
};

export default ImportExport;
