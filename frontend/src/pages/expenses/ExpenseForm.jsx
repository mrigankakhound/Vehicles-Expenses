import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  EXPENSE_TYPE_LABELS, WASHING_SERVICE_TYPE_LABELS, SERVICE_EXPENSE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS, VEHICLE_CATEGORY_LABELS, VEHICLE_SUB_CATEGORY_LABELS,
  formatDateForInput, getErrorMessage
} from '../../utils/helpers';
import { LoadingSpinner, PageCard } from '../../components/UI';
import { toast } from '../../components/Toast';

const ExpenseForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [parties, setParties] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showNewParty, setShowNewParty] = useState(false);
  const [newPartyName, setNewPartyName] = useState('');
  const [creatingParty, setCreatingParty] = useState(false);

  const defaultType = searchParams.get('type') || 'WASHING';

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      expenseType: defaultType,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH',
      paymentStatus: 'PAID',
    }
  });

  const expenseType = watch('expenseType');
  const vehicleId = watch('vehicleId');

  useEffect(() => {
    api.get('/vehicles/active').then((r) => setVehicles(r.data.data.vehicles)).catch(() => {});
  }, []);

  useEffect(() => {
    if (vehicleId) {
      const v = vehicles.find((x) => x.id === vehicleId);
      setSelectedVehicle(v || null);
    } else {
      setSelectedVehicle(null);
    }
  }, [vehicleId, vehicles]);

  useEffect(() => {
    if (expenseType) {
      const typePartyMap = {
        WASHING: 'WASHING_CENTER',
        FUEL: 'FUEL_STATION',
        VEHICLE_SERVICE: 'SERVICE_CENTER',
        OFFICE: 'OFFICE_VENDOR',
      };
      api.get('/parties/active', { params: { type: typePartyMap[expenseType] } })
        .then((r) => setParties(r.data.data.parties))
        .catch(() => {});
    }
  }, [expenseType]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/expenses/${id}`)
        .then(async (res) => {
          const e = res.data.data.expense;
          reset({
            expenseType: e.expenseType,
            date: formatDateForInput(e.date),
            vehicleId: e.vehicleId || '',
            partyId: e.partyId || '',
            amount: parseFloat(e.amount),
            paymentMethod: e.paymentMethod,
            paymentStatus: e.paymentStatus,
            serviceType: e.serviceType || '',
            serviceExpenseType: e.serviceExpenseType || '',
            expenseDescription: e.expenseDescription || '',
            note: e.note || '',
          });
          if (e.vehicle) setSelectedVehicle(e.vehicle);
        })
        .catch(() => toast.error('Failed to load expense.'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, reset]);

  const handleCreateParty = async () => {
    if (!newPartyName.trim()) return;
    const typeMap = { WASHING: 'WASHING_CENTER', FUEL: 'FUEL_STATION', VEHICLE_SERVICE: 'SERVICE_CENTER', OFFICE: 'OFFICE_VENDOR' };
    setCreatingParty(true);
    try {
      const res = await api.post('/parties', { name: newPartyName.trim(), type: typeMap[expenseType] || 'OTHER' });
      const created = res.data.data.party;
      setParties((prev) => [...prev, created]);
      setValue('partyId', created.id);
      setShowNewParty(false);
      setNewPartyName('');
      toast.success('Party created and selected.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreatingParty(false);
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        vehicleId: data.vehicleId || null,
        partyId: data.partyId || null,
        serviceType: data.serviceType || null,
        serviceExpenseType: data.serviceExpenseType || null,
        expenseDescription: data.expenseDescription || null,
        note: data.note || null,
      };

      if (isEdit) {
        await api.put(`/expenses/${id}`, payload);
        toast.success('Expense updated successfully.');
      } else {
        await api.post('/expenses', payload);
        toast.success('Expense created successfully.');
        const typeRoutes = { WASHING: '/expenses/washing', FUEL: '/expenses/fuel', VEHICLE_SERVICE: '/expenses/service', OFFICE: '/expenses/office' };
        navigate(typeRoutes[data.expenseType] || '/expenses');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const isOffice = expenseType === 'OFFICE';
  const isWashing = expenseType === 'WASHING';
  const isService = expenseType === 'VEHICLE_SERVICE';

  return (
    <PageCard
      title={isEdit ? 'Edit Expense' : 'Add Expense'}
      actions={
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left me-1"></i> Back
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '700px' }}>
        <div className="row g-3">
          {/* Expense Type */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Expense Type <span className="text-danger">*</span></label>
            <select className="form-select" {...register('expenseType', { required: true })}>
              {Object.entries(EXPENSE_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Date <span className="text-danger">*</span></label>
            <input
              type="date"
              className={`form-control ${errors.date ? 'is-invalid' : ''}`}
              {...register('date', { required: 'Date is required.' })}
            />
            {errors.date && <div className="invalid-feedback">{errors.date.message}</div>}
          </div>

          {/* Vehicle (not for Office) */}
          {!isOffice && (
            <div className="col-12">
              <label className="form-label fw-semibold">Vehicle <span className="text-danger">*</span></label>
              <select
                className={`form-select ${errors.vehicleId ? 'is-invalid' : ''}`}
                {...register('vehicleId', { required: !isOffice ? 'Vehicle is required.' : false })}
              >
                <option value="">— Select Vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.vehicleNumber} — {v.modelName}</option>
                ))}
              </select>
              {errors.vehicleId && <div className="invalid-feedback">{errors.vehicleId.message}</div>}

              {/* Auto-display vehicle info */}
              {selectedVehicle && (
                <div className="mt-2 p-2 rounded-2 d-flex gap-3" style={{ background: '#eff6ff', fontSize: '0.82rem' }}>
                  <span><b>Category:</b> {VEHICLE_CATEGORY_LABELS[selectedVehicle.vehicleCategory]}</span>
                  <span><b>Sub Category:</b> {VEHICLE_SUB_CATEGORY_LABELS[selectedVehicle.subCategory]}</span>
                  <span><b>Model:</b> {selectedVehicle.modelName}</span>
                </div>
              )}
            </div>
          )}

          {/* Washing Service Type */}
          {isWashing && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">Service Type <span className="text-danger">*</span></label>
              <select
                className={`form-select ${errors.serviceType ? 'is-invalid' : ''}`}
                {...register('serviceType', { required: isWashing ? 'Service type is required.' : false })}
              >
                <option value="">— Select Service Type —</option>
                {Object.entries(WASHING_SERVICE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.serviceType && <div className="invalid-feedback">{errors.serviceType.message}</div>}
            </div>
          )}

          {/* Vehicle Service Expense Type */}
          {isService && (
            <div className="col-md-6">
              <label className="form-label fw-semibold">Service Expense Type <span className="text-danger">*</span></label>
              <select
                className={`form-select ${errors.serviceExpenseType ? 'is-invalid' : ''}`}
                {...register('serviceExpenseType', { required: isService ? 'Service expense type is required.' : false })}
              >
                <option value="">— Select Type —</option>
                {Object.entries(SERVICE_EXPENSE_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              {errors.serviceExpenseType && <div className="invalid-feedback">{errors.serviceExpenseType.message}</div>}
            </div>
          )}

          {/* Expense Description (Office only) */}
          {isOffice && (
            <div className="col-12">
              <label className="form-label fw-semibold">Expense Description <span className="text-danger">*</span></label>
              <input
                type="text"
                className={`form-control ${errors.expenseDescription ? 'is-invalid' : ''}`}
                placeholder="e.g. Electricity bill, Internet bill..."
                {...register('expenseDescription', { required: isOffice ? 'Expense description is required.' : false })}
              />
              {errors.expenseDescription && <div className="invalid-feedback">{errors.expenseDescription.message}</div>}
            </div>
          )}

          {/* Amount */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Amount (₹) <span className="text-danger">*</span></label>
            <div className="input-group">
              <span className="input-group-text">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
                placeholder="0.00"
                {...register('amount', {
                  required: 'Amount is required.',
                  min: { value: 0.01, message: 'Amount must be greater than 0.' },
                })}
              />
              {errors.amount && <div className="invalid-feedback">{errors.amount.message}</div>}
            </div>
          </div>

          {/* Party */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Party / Vendor</label>
            <div className="d-flex gap-2">
              <select className="form-select" {...register('partyId')}>
                <option value="">— Select Party —</option>
                {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm flex-shrink-0"
                onClick={() => setShowNewParty(!showNewParty)}
                title="Add new party"
              >
                <i className="bi bi-plus-lg"></i>
              </button>
            </div>
            {showNewParty && (
              <div className="input-group mt-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="New party name..."
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleCreateParty}
                  disabled={creatingParty || !newPartyName.trim()}
                >
                  {creatingParty ? <span className="spinner-border spinner-border-sm"></span> : 'Add'}
                </button>
                <button type="button" className="btn btn-light btn-sm" onClick={() => { setShowNewParty(false); setNewPartyName(''); }}>
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Payment Method */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Payment Method <span className="text-danger">*</span></label>
            <select
              className={`form-select ${errors.paymentMethod ? 'is-invalid' : ''}`}
              {...register('paymentMethod', { required: 'Payment method is required.' })}
            >
              {Object.entries(PAYMENT_METHOD_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {errors.paymentMethod && <div className="invalid-feedback">{errors.paymentMethod.message}</div>}
          </div>

          {/* Payment Status */}
          <div className="col-md-6">
            <label className="form-label fw-semibold">Payment Status <span className="text-danger">*</span></label>
            <div className="d-flex gap-3 pt-1">
              {['PAID', 'UNPAID'].map((val) => (
                <div className="form-check" key={val}>
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`status_${val}`}
                    value={val}
                    {...register('paymentStatus', { required: true })}
                  />
                  <label className="form-check-label" htmlFor={`status_${val}`}>
                    {val === 'PAID' ? '✅ Paid' : '❌ Unpaid'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="col-12">
            <label className="form-label fw-semibold">Note <small className="text-muted">(optional)</small></label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Additional notes..."
              {...register('note')}
            ></textarea>
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check-lg me-1"></i>{isEdit ? 'Update Expense' : 'Add Expense'}</>}
          </button>
          <button type="button" className="btn btn-light px-4" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </PageCard>
  );
};

export default ExpenseForm;
