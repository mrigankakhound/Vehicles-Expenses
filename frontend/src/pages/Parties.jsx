import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, PARTY_TYPE_LABELS, getErrorMessage } from '../utils/helpers';
import { LoadingSpinner, EmptyState, ErrorState, PageCard, Pagination, StatusBadge } from '../components/UI';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from '../components/Toast';
import { useForm } from 'react-hook-form';

const PartyModal = ({ show, party, onClose, onSaved }) => {
  const isEdit = !!party;
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (party) reset({ name: party.name, type: party.type, status: party.status });
    else reset({ type: 'OTHER', status: 'ACTIVE' });
  }, [party, reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEdit) await api.put(`/parties/${party.id}`, data);
      else await api.post('/parties', data);
      toast.success(`Party ${isEdit ? 'updated' : 'created'} successfully.`);
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
            <h5 className="modal-title fw-bold">{isEdit ? 'Edit Party' : 'Add Party / Vendor'}</h5>
            <button className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-semibold">Party Name <span className="text-danger">*</span></label>
                <input
                  type="text"
                  className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. City Wash Center"
                  {...register('name', { required: 'Party name is required.' })}
                />
                {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Type <span className="text-danger">*</span></label>
                <select className="form-select" {...register('type', { required: true })}>
                  {Object.entries(PARTY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label fw-semibold">Status</label>
                <select className="form-select" {...register('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer border-0">
              <button type="button" className="btn btn-light px-4" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary px-4" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : isEdit ? 'Update Party' : 'Add Party'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Parties = () => {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [modal, setModal] = useState({ show: false, party: null });
  const [confirm, setConfirm] = useState({ show: false, party: null, newStatus: null });

  const fetchParties = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20, search, status: statusFilter, type: typeFilter };
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k]; });
      const res = await api.get('/parties', { params });
      setParties(res.data.data.parties);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, typeFilter]);

  useEffect(() => { fetchParties(1); }, [fetchParties]);

  const handleStatusToggle = (party) => {
    const newStatus = party.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirm({ show: true, party, newStatus });
  };

  const confirmStatusChange = async () => {
    try {
      await api.patch(`/parties/${confirm.party.id}/status`, { status: confirm.newStatus });
      toast.success(`Party ${confirm.newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`);
      setConfirm({ show: false });
      fetchParties(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirm({ show: false });
    }
  };

  return (
    <>
      <PageCard
        title="Parties / Vendors"
        subtitle={`${pagination.total} party(s)`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModal({ show: true, party: null })}>
            <i className="bi bi-plus-lg me-1"></i> Add Party
          </button>
        }
      >
        <div className="row g-2 mb-3">
          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input type="text" className="form-control" placeholder="Search party name..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(PARTY_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}>
              <i className="bi bi-x-lg me-1"></i>Clear
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner /> : error ? <ErrorState message={error} onRetry={() => fetchParties(1)} /> : parties.length === 0 ? (
          <EmptyState icon="bi-people" title="No parties found" action={<button className="btn btn-primary btn-sm" onClick={() => setModal({ show: true, party: null })}>Add Party</button>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Party Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parties.map((p) => (
                    <tr key={p.id}>
                      <td className="fw-semibold">{p.name}</td>
                      <td><span className="badge bg-light text-dark border" style={{ fontSize: '0.72rem' }}>{PARTY_TYPE_LABELS[p.type]}</span></td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <button className="btn btn-outline-secondary btn-sm py-0 px-2" onClick={() => setModal({ show: true, party: p })}>
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className={`btn btn-sm py-0 px-2 ${p.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleStatusToggle(p)}
                          >
                            <i className={`bi ${p.status === 'ACTIVE' ? 'bi-slash-circle' : 'bi-check-circle'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchParties(p)} />
            </div>
          </>
        )}
      </PageCard>

      <PartyModal
        show={modal.show}
        party={modal.party}
        onClose={() => setModal({ show: false, party: null })}
        onSaved={() => fetchParties(pagination.page)}
      />

      <ConfirmDialog
        show={confirm.show}
        title={`${confirm.newStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'} Party`}
        message={`Are you sure you want to ${confirm.newStatus === 'INACTIVE' ? 'deactivate' : 'activate'} party "${confirm.party?.name}"?`}
        confirmText={confirm.newStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={confirm.newStatus === 'INACTIVE' ? 'warning' : 'success'}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirm({ show: false })}
      />
    </>
  );
};

export default Parties;
