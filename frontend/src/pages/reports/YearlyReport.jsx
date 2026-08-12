import React, { useState } from 'react';
import api from '../../services/api';
import { formatCurrency, MONTHS, getYearOptions } from '../../utils/helpers';
import { LoadingSpinner, ErrorState, PageCard, SummaryCard } from '../../components/UI';

const CURRENT_YEAR = new Date().getFullYear();

const YearlyReport = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const years = getYearOptions(2018);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/yearly', { params: { year } });
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    const token = localStorage.getItem('fleetcost_token');
    const a = document.createElement('a');
    a.href = `${import.meta.env.VITE_API_URL}/export/yearly?year=${year}&token=${token}`;
    a.click();
  };

  const handlePdfExport = () => {
    const token = localStorage.getItem('fleetcost_token');
    window.open(`${import.meta.env.VITE_API_URL}/export/pdf/yearly?year=${year}&token=${token}`, '_blank');
  };

  return (
    <div>
      <PageCard
        title="Yearly Report"
        actions={data && (
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success btn-sm" onClick={handleExcelExport}><i className="bi bi-file-earmark-excel me-1"></i>Excel</button>
            <button className="btn btn-outline-danger btn-sm" onClick={handlePdfExport}><i className="bi bi-file-earmark-pdf me-1"></i>PDF</button>
          </div>
        )}
      >
        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Year</label>
            <select className="form-select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-primary w-100" onClick={fetchReport} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Loading...</> : <><i className="bi bi-search me-1"></i>Generate Report</>}
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} onRetry={fetchReport} />}

        {data && !loading && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3"><SummaryCard label="Total Expense" value={formatCurrency(data.summary.total)} icon="bi-graph-up" color="#1e40af" bgColor="#eff6ff" /></div>
              <div className="col-md-3"><SummaryCard label="Total Paid" value={formatCurrency(data.summary.paid)} icon="bi-check-circle" color="#16a34a" bgColor="#f0fdf4" /></div>
              <div className="col-md-3"><SummaryCard label="Total Unpaid" value={formatCurrency(data.summary.unpaid)} icon="bi-exclamation-circle" color="#dc2626" bgColor="#fef2f2" /></div>
              <div className="col-md-3"><SummaryCard label="Fuel" value={formatCurrency(data.summary.fuel)} icon="bi-fuel-pump" color="#ea580c" bgColor="#fff7ed" /></div>
            </div>

            <div className="row g-3 mb-4">
              {[
                { label: 'Washing', val: data.summary.washing, color: '#7c3aed' },
                { label: 'Vehicle Service', val: data.summary.service, color: '#0891b2' },
                { label: 'Office', val: data.summary.office, color: '#65a30d' },
              ].map((c) => (
                <div className="col-md-4" key={c.label}>
                  <div className="card border-0 h-100" style={{ borderLeft: `4px solid ${c.color}`, background: `${c.color}08` }}>
                    <div className="card-body py-3">
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>{c.label}</div>
                      <div className="fw-bold" style={{ fontSize: '1.1rem', color: c.color }}>{formatCurrency(c.val)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h6 className="fw-bold mb-3">Monthly Breakdown — {data.year}</h6>
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Month</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Washing</th>
                    <th className="text-end">Fuel</th>
                    <th className="text-end">Service</th>
                    <th className="text-end">Office</th>
                    <th className="text-end">Paid</th>
                    <th className="text-end">Unpaid</th>
                  </tr>
                </thead>
                <tbody>
                  {data.monthlyBreakdown.map((row) => (
                    <tr key={row.month} className={row.total === 0 ? 'text-muted' : ''}>
                      <td className="fw-semibold">{MONTHS[row.month - 1]}</td>
                      <td className="text-end fw-bold">{formatCurrency(row.total)}</td>
                      <td className="text-end">{formatCurrency(row.washing)}</td>
                      <td className="text-end">{formatCurrency(row.fuel)}</td>
                      <td className="text-end">{formatCurrency(row.service)}</td>
                      <td className="text-end">{formatCurrency(row.office)}</td>
                      <td className="text-end text-success">{formatCurrency(row.paid)}</td>
                      <td className="text-end text-danger">{formatCurrency(row.unpaid)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="table-primary fw-bold">
                    <td>TOTAL</td>
                    <td className="text-end">{formatCurrency(data.summary.total)}</td>
                    <td className="text-end">{formatCurrency(data.summary.washing)}</td>
                    <td className="text-end">{formatCurrency(data.summary.fuel)}</td>
                    <td className="text-end">{formatCurrency(data.summary.service)}</td>
                    <td className="text-end">{formatCurrency(data.summary.office)}</td>
                    <td className="text-end text-success">{formatCurrency(data.summary.paid)}</td>
                    <td className="text-end text-danger">{formatCurrency(data.summary.unpaid)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
};

export default YearlyReport;
