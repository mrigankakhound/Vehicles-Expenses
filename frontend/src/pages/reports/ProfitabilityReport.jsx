import React, { useState } from 'react';
import api from '../../services/api';
import { formatCurrency, formatMargin, getYearOptions } from '../../utils/helpers';
import { LoadingSpinner, ErrorState, PageCard } from '../../components/UI';

const CURRENT_YEAR = new Date().getFullYear();

const SORT_OPTIONS = [
  { val: 'profit_desc', label: 'Highest Profit' },
  { val: 'profit_asc', label: 'Lowest Profit' },
  { val: 'revenue_desc', label: 'Highest Revenue' },
  { val: 'cost_desc', label: 'Highest Expense' },
  { val: 'margin_desc', label: 'Highest Margin' },
  { val: 'margin_asc', label: 'Lowest Margin' },
];

const ProfitabilityReport = () => {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('profit_desc');
  const years = getYearOptions(2018);

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/reports/profitability', { params: { year } });
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
    a.href = `${import.meta.env.VITE_API_URL}/export/profitability?year=${year}&token=${token}`;
    a.click();
  };

  const handlePdfExport = () => {
    const token = localStorage.getItem('fleetcost_token');
    window.open(`${import.meta.env.VITE_API_URL}/export/pdf/profitability?year=${year}&token=${token}`, '_blank');
  };

  const getSorted = () => {
    if (!data?.profitability) return [];
    const arr = [...data.profitability];
    switch (sortBy) {
      case 'profit_desc': return arr.sort((a, b) => b.profit - a.profit);
      case 'profit_asc': return arr.sort((a, b) => a.profit - b.profit);
      case 'revenue_desc': return arr.sort((a, b) => b.revenue - a.revenue);
      case 'cost_desc': return arr.sort((a, b) => b.totalCost - a.totalCost);
      case 'margin_desc': return arr.sort((a, b) => (b.profitMargin ?? -Infinity) - (a.profitMargin ?? -Infinity));
      case 'margin_asc': return arr.sort((a, b) => (a.profitMargin ?? Infinity) - (b.profitMargin ?? Infinity));
      default: return arr;
    }
  };

  const profitable = data?.profitability?.filter((p) => p.profit > 0).length || 0;
  const lossMaking = data?.profitability?.filter((p) => p.profit < 0).length || 0;
  const breakEven = data?.profitability?.filter((p) => p.profit === 0).length || 0;

  return (
    <div>
      <PageCard
        title="Vehicle Profitability Analysis"
        subtitle="Revenue - Direct Vehicle Cost = Profit/Loss"
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
            {/* Summary stats */}
            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #16a34a' }}>
                  <div className="card-body py-3">
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Profitable Vehicles</div>
                    <div className="fw-bold text-success" style={{ fontSize: '1.5rem' }}>{profitable}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #dc2626' }}>
                  <div className="card-body py-3">
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Loss-Making Vehicles</div>
                    <div className="fw-bold text-danger" style={{ fontSize: '1.5rem' }}>{lossMaking}</div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 shadow-sm" style={{ borderLeft: '4px solid #64748b' }}>
                  <div className="card-body py-3">
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Break Even / No Revenue</div>
                    <div className="fw-bold text-secondary" style={{ fontSize: '1.5rem' }}>{data.profitability.length - profitable - lossMaking}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0">Vehicle Performance — {data.period.year}</h6>
              <div className="d-flex align-items-center gap-2">
                <label className="form-label mb-0 small fw-semibold">Sort by:</label>
                <select className="form-select form-select-sm" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  {SORT_OPTIONS.map((o) => <option key={o.val} value={o.val}>{o.label}</option>)}
                </select>
              </div>
            </div>

            {data.profitability.length === 0 ? (
              <p className="text-muted">No vehicles found.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>#</th>
                      <th>Vehicle</th>
                      <th>Model</th>
                      <th className="text-end">Revenue (₹)</th>
                      <th className="text-end">Total Cost (₹)</th>
                      <th className="text-end">Fuel</th>
                      <th className="text-end">Washing</th>
                      <th className="text-end">Service</th>
                      <th className="text-end">Profit/Loss (₹)</th>
                      <th className="text-end">Margin</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getSorted().map((row, idx) => (
                      <tr
                        key={row.vehicle.id}
                        style={{
                          background: row.profit < 0 ? '#fef2f2' : row.profit > 0 ? '#f0fdf4' : '#f8f9fa',
                        }}
                      >
                        <td className="text-muted" style={{ fontSize: '0.8rem' }}>{idx + 1}</td>
                        <td className="fw-semibold text-primary">{row.vehicle.vehicleNumber}</td>
                        <td style={{ fontSize: '0.82rem' }}>{row.vehicle.modelName}</td>
                        <td className="text-end">{formatCurrency(row.revenue)}</td>
                        <td className="text-end fw-semibold">{formatCurrency(row.totalCost)}</td>
                        <td className="text-end" style={{ fontSize: '0.82rem' }}>{formatCurrency(row.fuelCost)}</td>
                        <td className="text-end" style={{ fontSize: '0.82rem' }}>{formatCurrency(row.washingCost)}</td>
                        <td className="text-end" style={{ fontSize: '0.82rem' }}>{formatCurrency(row.serviceCost)}</td>
                        <td className={`text-end fw-bold ${row.profit > 0 ? 'text-success' : row.profit < 0 ? 'text-danger' : 'text-secondary'}`}>
                          {row.profit < 0 ? '-' : ''}{formatCurrency(Math.abs(row.profit))}
                        </td>
                        <td className={`text-end fw-semibold ${row.profit > 0 ? 'text-success' : row.profit < 0 ? 'text-danger' : ''}`}>
                          {formatMargin(row.profitMargin)}
                        </td>
                        <td>
                          {row.profit > 0 ? (
                            <span className="badge bg-success-subtle text-success">Profitable</span>
                          ) : row.profit < 0 ? (
                            <span className="badge bg-danger-subtle text-danger">Loss</span>
                          ) : (
                            <span className="badge bg-secondary-subtle text-secondary">Break Even</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-3 p-3 rounded-2" style={{ background: '#f8fafc', fontSize: '0.82rem' }}>
              <strong>Note:</strong> Profit Margin shows <strong>N/A</strong> when revenue is ₹0 to avoid division by zero.
              Only direct vehicle expenses (linked via Vehicle ID) are counted toward vehicle cost.
              Office expenses are excluded from vehicle cost calculations.
            </div>
          </>
        )}
      </PageCard>
    </div>
  );
};

export default ProfitabilityReport;
