import React, { useState } from 'react';
import api from '../../services/api';
import { formatCurrency, MONTHS, getYearOptions } from '../../utils/helpers';
import { LoadingSpinner, ErrorState, PageCard, SummaryCard } from '../../components/UI';
import { toast } from '../../components/Toast';

const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

const MonthlyReport = () => {
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const years = getYearOptions(2018);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/monthly', { params: { month, year } });
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    const token = localStorage.getItem('fleetcost_token');
    const url = `${import.meta.env.VITE_API_URL}/export/monthly?month=${month}&year=${year}&token=${token}`;
    const a = document.createElement('a'); a.href = url; a.click();
  };

  const handlePdfExport = () => {
    const token = localStorage.getItem('fleetcost_token');
    const url = `${import.meta.env.VITE_API_URL}/export/pdf/monthly?month=${month}&year=${year}&token=${token}`;
    window.open(url, '_blank');
  };

  return (
    <div>
      <PageCard
        title="Monthly Report"
        actions={data && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success btn-sm" onClick={handleExcelExport}>
              <i className="bi bi-file-earmark-excel me-1"></i> Excel
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={handlePdfExport}>
              <i className="bi bi-file-earmark-pdf me-1"></i> PDF
            </button>
          </div>
        )}
      >
        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Month</label>
            <select className="form-select" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Year</label>
            <select className="form-select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100" onClick={fetchReport} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Loading...</> : <><i className="bi bi-search me-1"></i> Generate Report</>}
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} onRetry={fetchReport} />}

        {data && !loading && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="badge bg-primary fs-6 px-3 py-2">{MONTHS[data.period.month - 1]} {data.period.year}</span>
            </div>

            {/* Summary cards */}
            <div className="row g-3 mb-4">
              <div className="col-md-4"><SummaryCard label="Total Expense" value={formatCurrency(data.summary.total)} icon="bi-graph-up" color="#1e40af" bgColor="#eff6ff" /></div>
              <div className="col-md-4"><SummaryCard label="Total Paid" value={formatCurrency(data.summary.paid)} icon="bi-check-circle" color="#16a34a" bgColor="#f0fdf4" /></div>
              <div className="col-md-4"><SummaryCard label="Total Unpaid" value={formatCurrency(data.summary.unpaid)} icon="bi-exclamation-circle" color="#dc2626" bgColor="#fef2f2" /></div>
            </div>

            {/* Category breakdown */}
            <div className="row g-3 mb-4">
              {[
                { label: 'Washing', val: data.summary.washing, color: '#7c3aed' },
                { label: 'Fuel', val: data.summary.fuel, color: '#ea580c' },
                { label: 'Vehicle Service', val: data.summary.service, color: '#0891b2' },
                { label: 'Office', val: data.summary.office, color: '#65a30d' },
              ].map((c) => (
                <div className="col-md-3" key={c.label}>
                  <div className="card border-0 h-100" style={{ borderLeft: `4px solid ${c.color}`, background: `${c.color}08` }}>
                    <div className="card-body py-3">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{c.label}</div>
                      <div className="fw-bold" style={{ fontSize: '1.1rem', color: c.color }}>{formatCurrency(c.val)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Expense table */}
            <h6 className="fw-bold mb-2">Expense Details ({data.expenses.length} records)</h6>
            {data.expenses.length === 0 ? (
              <p className="text-muted">No expenses for this period.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Date</th><th>Type</th><th>Vehicle</th><th>Party</th><th>Description</th>
                      <th className="text-end">Amount</th><th>MOP</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontSize: '0.82rem' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.expenseType.replace('_', ' ')}</td>
                        <td style={{ fontSize: '0.82rem' }}>{e.vehicle?.vehicleNumber || 'N/A'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{e.party?.name || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{e.expenseDescription || e.serviceType || e.serviceExpenseType || '—'}</td>
                        <td className="text-end fw-semibold" style={{ fontSize: '0.88rem' }}>{formatCurrency(e.amount)}</td>
                        <td style={{ fontSize: '0.78rem' }}>{e.paymentMethod}</td>
                        <td>
                          <span className={`badge ${e.paymentStatus === 'PAID' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`} style={{ fontSize: '0.7rem' }}>
                            {e.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-primary fw-bold">
                      <td colSpan={5}>TOTAL</td>
                      <td className="text-end">{formatCurrency(data.summary.total)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </PageCard>
    </div>
  );
};

export default MonthlyReport;
