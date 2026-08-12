import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { formatCurrency, SERVICE_EXPENSE_TYPE_LABELS, getYearOptions } from '../../utils/helpers';
import { LoadingSpinner, ErrorState, PageCard, SummaryCard } from '../../components/UI';

const CURRENT_YEAR = new Date().getFullYear();

const VehicleExpenseReport = () => {
  const [vehicleId, setVehicleId] = useState('');
  const [year, setYear] = useState(CURRENT_YEAR);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const years = getYearOptions(2018);

  useEffect(() => {
    api.get('/vehicles').then((r) => setVehicles(r.data.data.vehicles)).catch(() => {});
  }, []);

  const fetchReport = async () => {
    if (!vehicleId) { setError('Please select a vehicle.'); return; }
    setLoading(true);
    setError('');
    try {
      const params = { vehicleId };
      if (useCustomRange) { if (dateFrom) params.dateFrom = dateFrom; if (dateTo) params.dateTo = dateTo; }
      else params.year = year;
      const res = await api.get('/reports/vehicle-expense', { params });
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = () => {
    const token = localStorage.getItem('fleetcost_token');
    const params = new URLSearchParams({ vehicleId, token });
    if (useCustomRange) { if (dateFrom) params.set('dateFrom', dateFrom); if (dateTo) params.set('dateTo', dateTo); }
    else params.set('year', year);
    const a = document.createElement('a');
    a.href = `${import.meta.env.VITE_API_URL}/export/vehicle-expense?${params}`;
    a.click();
  };

  return (
    <div>
      <PageCard
        title="Vehicle Expense Report"
        actions={data && <button className="btn btn-outline-success btn-sm" onClick={handleExcelExport}><i className="bi bi-file-earmark-excel me-1"></i>Excel</button>}
      >
        <div className="row g-3 align-items-end mb-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Vehicle <span className="text-danger">*</span></label>
            <select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">— Select Vehicle —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.modelName}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <div className="form-check form-switch pt-3">
              <input className="form-check-input" type="checkbox" id="useCustomRange" checked={useCustomRange} onChange={(e) => setUseCustomRange(e.target.checked)} />
              <label className="form-check-label" htmlFor="useCustomRange">Custom Range</label>
            </div>
          </div>
          {!useCustomRange ? (
            <div className="col-md-2">
              <label className="form-label fw-semibold">Year</label>
              <select className="form-select" value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          ) : (
            <>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Date From</label>
                <input type="date" className="form-control" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Date To</label>
                <input type="date" className="form-control" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </>
          )}
          <div className="col-md-2">
            <button className="btn btn-primary w-100" onClick={fetchReport} disabled={loading}>
              {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Loading...</> : <><i className="bi bi-search me-1"></i>Generate</>}
            </button>
          </div>
        </div>

        {loading && <LoadingSpinner />}
        {error && <div className="alert alert-danger">{error}</div>}

        {data && !loading && (
          <>
            <div className="d-flex align-items-center gap-2 mb-3">
              <div className="badge bg-primary fs-6 px-3 py-2">{data.vehicle.vehicleNumber}</div>
              <span className="text-muted">{data.vehicle.modelName}</span>
              {data.period.year && <span className="badge bg-secondary">{data.period.year}</span>}
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-3"><SummaryCard label="Total Vehicle Cost" value={formatCurrency(data.summary.total)} icon="bi-graph-up" color="#1e40af" bgColor="#eff6ff" /></div>
              <div className="col-md-3"><SummaryCard label="Fuel" value={formatCurrency(data.summary.fuel)} icon="bi-fuel-pump" color="#ea580c" bgColor="#fff7ed" /></div>
              <div className="col-md-3"><SummaryCard label="Washing" value={formatCurrency(data.summary.washing)} icon="bi-droplet" color="#7c3aed" bgColor="#f5f3ff" /></div>
              <div className="col-md-3"><SummaryCard label="Service" value={formatCurrency(data.summary.service)} icon="bi-tools" color="#0891b2" bgColor="#ecfeff" /></div>
            </div>

            <h6 className="fw-bold mb-2">All Expenses — {data.expenses.length} records</h6>
            {data.expenses.length === 0 ? (
              <p className="text-muted">No expenses recorded for this vehicle in the selected period.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle">
                  <thead className="table-light">
                    <tr><th>Date</th><th>Type</th><th>Description</th><th>Party</th><th className="text-end">Amount</th><th>MOP</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {data.expenses.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontSize: '0.82rem' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ fontSize: '0.8rem' }}>{e.expenseType.replace('_', ' ')}</td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {e.serviceExpenseType ? SERVICE_EXPENSE_TYPE_LABELS[e.serviceExpenseType] : (e.serviceType || e.expenseDescription || '—')}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{e.party?.name || '—'}</td>
                        <td className="text-end fw-semibold">{formatCurrency(e.amount)}</td>
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
                      <td colSpan={4}>TOTAL VEHICLE COST</td>
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

export default VehicleExpenseReport;
