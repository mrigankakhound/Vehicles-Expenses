import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  formatCurrency, formatDate, EXPENSE_TYPE_LABELS, PAYMENT_METHOD_LABELS,
  VEHICLE_CATEGORY_LABELS, getErrorMessage
} from '../../utils/helpers';
import { LoadingSpinner, EmptyState, ErrorState, PageCard, Pagination, StatusBadge } from '../../components/UI';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const ALL_EXPENSE_TYPES = Object.keys(EXPENSE_TYPE_LABELS);

const AllExpenses = ({ filterType }) => {
  const [searchParams] = useSearchParams();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const [deleting, setDeleting] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [expenseType, setExpenseType] = useState(filterType || '');
  const [vehicleId, setVehicleId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [vehicles, setVehicles] = useState([]);
  const [parties, setParties] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimer = useRef(null);

  useEffect(() => {
    // Load dropdown options
    api.get('/vehicles/active').then((r) => setVehicles(r.data.data.vehicles)).catch(() => {});
    api.get('/parties/active').then((r) => setParties(r.data.data.parties)).catch(() => {});
  }, []);

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page, limit: 20,
        search: search.trim(),
        expenseType: expenseType || filterType || '',
        vehicleId, partyId, paymentStatus, paymentMethod,
        dateFrom, dateTo, minAmount, maxAmount,
      };
      // Remove empty params
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });

      const res = await api.get('/expenses', { params });
      setExpenses(res.data.data.expenses);
      setPagination(res.data.data.pagination);
      setFilteredTotal(res.data.data.filteredTotal);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, expenseType, filterType, vehicleId, partyId, paymentStatus, paymentMethod, dateFrom, dateTo, minAmount, maxAmount]);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchExpenses(1), 300);
    return () => clearTimeout(searchTimer.current);
  }, [fetchExpenses]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/expenses/${confirm.id}`);
      toast.success('Expense deleted successfully.');
      setConfirm({ show: false });
      fetchExpenses(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirm({ show: false });
    } finally {
      setDeleting(false);
    }
  };

  const resetFilters = () => {
    setSearch(''); setVehicleId(''); setPartyId(''); setPaymentStatus('');
    setPaymentMethod(''); setDateFrom(''); setDateTo(''); setMinAmount(''); setMaxAmount('');
    if (!filterType) setExpenseType('');
  };

  const typeLabel = filterType ? EXPENSE_TYPE_LABELS[filterType] : 'All';

  const buildExportUrl = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (expenseType || filterType) params.set('expenseType', expenseType || filterType);
    if (vehicleId) params.set('vehicleId', vehicleId);
    if (partyId) params.set('partyId', partyId);
    if (paymentStatus) params.set('paymentStatus', paymentStatus);
    if (paymentMethod) params.set('paymentMethod', paymentMethod);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    const token = localStorage.getItem('fleetcost_token');
    params.set('token', token);
    return `${import.meta.env.VITE_API_URL}/export/expenses?${params.toString()}`;
  };

  const handleExport = () => {
    const a = document.createElement('a');
    a.href = buildExportUrl();
    a.click();
  };

  return (
    <>
      <PageCard
        title={`${typeLabel} Expenses`}
        subtitle={`${pagination.total} record(s) · Filtered Total: ${formatCurrency(filteredTotal)}`}
        actions={
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success btn-sm" onClick={handleExport}>
              <i className="bi bi-file-earmark-excel me-1"></i> Export
            </button>
            <Link
              to={filterType ? `/expenses/new?type=${filterType}` : '/expenses/new'}
              className="btn btn-primary btn-sm"
            >
              <i className="bi bi-plus-lg me-1"></i> Add Expense
            </Link>
          </div>
        }
      >
        {/* Search + Filter bar */}
        <div className="row g-2 mb-3">
          <div className="col-md-4">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control form-control-sm" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} title="Date From" />
          </div>
          <div className="col-md-2">
            <input type="date" className="form-control form-control-sm" value={dateTo} onChange={(e) => setDateTo(e.target.value)} title="Date To" />
          </div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>
          <div className="col-md-2">
            <div className="d-flex gap-1">
              <button
                className={`btn btn-sm flex-grow-1 ${showFilters ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <i className="bi bi-funnel me-1"></i> Filters
              </button>
              <button className="btn btn-outline-secondary btn-sm px-2" onClick={resetFilters} title="Clear filters">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="row g-2 mb-3 p-3 rounded-2" style={{ background: '#f8fafc' }}>
            {!filterType && (
              <div className="col-md-3">
                <label className="form-label form-label-sm">Expense Type</label>
                <select className="form-select form-select-sm" value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
                  <option value="">All Types</option>
                  {ALL_EXPENSE_TYPES.map((t) => <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>)}
                </select>
              </div>
            )}
            <div className="col-md-3">
              <label className="form-label form-label-sm">Vehicle</label>
              <select className="form-select form-select-sm" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                <option value="">All Vehicles</option>
                {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.modelName}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">Party</label>
              <select className="form-select form-select-sm" value={partyId} onChange={(e) => setPartyId(e.target.value)}>
                <option value="">All Parties</option>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">Payment Method</label>
              <select className="form-select form-select-sm" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="">All Methods</option>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">Min Amount (₹)</label>
              <input type="number" className="form-control form-control-sm" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} min="0" />
            </div>
            <div className="col-md-3">
              <label className="form-label form-label-sm">Max Amount (₹)</label>
              <input type="number" className="form-control form-control-sm" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} min="0" />
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchExpenses(1)} />
        ) : expenses.length === 0 ? (
          <EmptyState icon="bi-receipt" title="No expenses found" message="Try adjusting your filters or add a new expense." />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Vehicle</th>
                    <th>Party</th>
                    <th>Description</th>
                    <th className="text-end">Amount</th>
                    <th>MOP</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{formatDate(e.date)}</td>
                      <td>
                        <span className={`badge ${
                          e.expenseType === 'WASHING' ? 'bg-purple-subtle text-purple' :
                          e.expenseType === 'FUEL' ? 'bg-warning-subtle text-warning' :
                          e.expenseType === 'VEHICLE_SERVICE' ? 'bg-info-subtle text-info' :
                          'bg-success-subtle text-success'
                        }`} style={{ fontSize: '0.7rem' }}>
                          {EXPENSE_TYPE_LABELS[e.expenseType]}
                        </span>
                      </td>
                      <td className="fw-semibold" style={{ fontSize: '0.82rem' }}>
                        {e.vehicle ? e.vehicle.vehicleNumber : <span className="text-muted">N/A</span>}
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{e.party?.name || '—'}</td>
                      <td style={{ fontSize: '0.82rem', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.expenseDescription || e.serviceType || e.serviceExpenseType || '—'}
                      </td>
                      <td className="text-end fw-semibold" style={{ whiteSpace: 'nowrap' }}>{formatCurrency(e.amount)}</td>
                      <td><span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>{PAYMENT_METHOD_LABELS[e.paymentMethod]}</span></td>
                      <td><StatusBadge status={e.paymentStatus} /></td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <Link to={`/expenses/${e.id}/edit`} className="btn btn-outline-secondary btn-sm py-0 px-2">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            className="btn btn-outline-danger btn-sm py-0 px-2"
                            onClick={() => setConfirm({ show: true, id: e.id })}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Filtered total footer */}
            <div className="d-flex align-items-center justify-content-between mt-3 pt-2 border-top">
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted" style={{ fontSize: '0.82rem' }}>{pagination.total} record(s)</span>
                <span className="fw-bold text-primary">Filtered Total: {formatCurrency(filteredTotal)}</span>
              </div>
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchExpenses(p)} />
            </div>
          </>
        )}
      </PageCard>

      <ConfirmDialog
        show={confirm.show}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ show: false })}
      />
    </>
  );
};

export default AllExpenses;
