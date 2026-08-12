import React, { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { formatCurrency, getErrorMessage, getYearOptions } from '../utils/helpers';
import { LoadingSpinner, EmptyState, ErrorState, PageCard, Pagination } from '../components/UI';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { useForm } from 'react-hook-form';
import { VEHICLE_CATEGORY_LABELS } from '../utils/helpers';

const RevenueModal = ({ show, revenue, vehicles, onClose, onSaved }) => {
  const isEdit = !!revenue;
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const years = getYearOptions(2018);

  useEffect(() => {
    if (revenue) {
      reset({ vehicleId: revenue.vehicleId, year: revenue.year, revenueAmount: parseFloat(revenue.revenueAmount), note: revenue.note || '' });
    } else {
      reset({ year: new Date().getFullYear(), note: '' });
    }
  }, [revenue, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEdit) await api.put(`/revenue/${revenue.id}`, data);
      else await api.post('/revenue', data);
      toast.success(`Revenue ${isEdit ? 'updated' : 'created'} successfully.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;
  return (
    <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 9990 }} onClick={onClose}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0">
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Revenue' : 'Add Vehicle Revenue'}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Vehicle <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.vehicleId ? 'is-invalid' : ''}`}
                  {...register('vehicleId', { required: 'Vehicle is required.' })}
                  disabled={isEdit}
                >
                  <option value="">— Select Vehicle —</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.modelName}</option>)}
                </select>
                {errors.vehicleId && <div className="invalid-feedback">{errors.vehicleId.message}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Year <span className="text-danger">*</span></label>
                <select
                  className={`form-select ${errors.year ? 'is-invalid' : ''}`}
                  {...register('year', { required: 'Year is required.' })}
                  disabled={isEdit}
                >
                  {years.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Annual Revenue (₹) <span className="text-danger">*</span></label>
                <div className="input-group">
                  <span className="input-group-text">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`form-control ${errors.revenueAmount ? 'is-invalid' : ''}`}
                    placeholder="0.00"
                    {...register('revenueAmount', {
                      required: 'Revenue amount is required.',
                      min: { value: 0, message: 'Amount must be 0 or more.' },
                    })}
                  />
                  {errors.revenueAmount && <div className="invalid-feedback">{errors.revenueAmount.message}</div>}
                </div>
              </div>
              <div>
                <label className="form-label fw-semibold">Note <small className="text-muted">(optional)</small></label>
                <textarea className="form-control" rows={2} {...register('note')}></textarea>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light px-4" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : isEdit ? 'Update' : 'Add Revenue'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Revenue = () => {
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [vehicles, setVehicles] = useState([]);
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [modal, setModal] = useState({ show: false, revenue: null });
  const [confirm, setConfirm] = useState({ show: false, id: null });
  const [deleting, setDeleting] = useState(false);
  const years = getYearOptions(2018);

  useEffect(() => {
    api.get('/vehicles/active').then((r) => setVehicles(r.data.data.vehicles)).catch(() => {});
  }, []);

  const fetchRevenues = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20, vehicleId: vehicleFilter, year: yearFilter };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await api.get('/revenue', { params });
      setRevenues(res.data.data.revenues);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [vehicleFilter, yearFilter]);

  useEffect(() => { fetchRevenues(1); }, [fetchRevenues]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/revenue/${confirm.id}`);
      toast.success('Revenue record deleted.');
      setConfirm({ show: false });
      fetchRevenues(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirm({ show: false });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageCard
        title="Vehicle Revenue"
        subtitle={`${pagination.total} record(s)`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ show: true, revenue: null })}>
            <i className="bi bi-plus-lg me-1"></i> Add Revenue
          </button>
        }
      >
        <div className="alert alert-info d-flex align-items-start gap-2 py-2 mb-3" style={{ fontSize: '0.82rem' }}>
          <i className="bi bi-info-circle flex-shrink-0 mt-1"></i>
          Enter the annual revenue generated by each vehicle. This is used for profitability analysis. One revenue record per vehicle per year.
        </div>

        <div className="row g-2 mb-3">
          <div className="col-md-5">
            <select className="form-select form-select-sm" value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)}>
              <option value="">All Vehicles</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.modelName}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">All Years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setVehicleFilter(''); setYearFilter(''); }}>
              <i className="bi bi-x-lg me-1"></i>Clear
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={() => fetchRevenues(1)} /> : revenues.length === 0 ? (
          <EmptyState icon="bi-cash-stack" title="No revenue records" message="Add revenue records for vehicles to enable profitability analysis." action={<button className="btn btn-primary btn-sm" onClick={() => setModal({ show: true, revenue: null })}>Add Revenue</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Vehicle</th>
                    <th>Model</th>
                    <th>Year</th>
                    <th className="text-end">Revenue (₹)</th>
                    <th>Note</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((r) => (
                    <tr key={r.id}>
                      <td className="fw-semibold text-primary">{r.vehicle?.vehicleNumber}</td>
                      <td style={{ fontSize: '0.82rem' }}>{r.vehicle?.modelName}</td>
                      <td><span className="badge bg-primary-subtle text-primary">{r.year}</span></td>
                      <td className="text-end fw-bold text-success">{formatCurrency(r.revenueAmount)}</td>
                      <td style={{ fontSize: '0.82rem', color: '#6b7280' }}>{r.note || '—'}</td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={() => setModal({ show: true, revenue: r })}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-outline-danger btn-sm py-0 px-2" onClick={() => setConfirm({ show: true, id: r.id })}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchRevenues(p)} />
            </div>
          </>
        )}
      </PageCard>

      <RevenueModal show={modal.show} revenue={modal.revenue} vehicles={vehicles} onClose={() => setModal({ show: false })} onSaved={() => fetchRevenues(pagination.page)} />

      <ConfirmDialog
        show={confirm.show}
        title="Delete Revenue Record"
        message="Are you sure you want to delete this revenue record? This will affect profitability calculations."
        confirmText="Delete"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ show: false })}
      />
    </>
  );
};

export default Revenue;
