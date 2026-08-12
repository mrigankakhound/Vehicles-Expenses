import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import {
  formatCurrency, VEHICLE_CATEGORY_LABELS, VEHICLE_SUB_CATEGORY_LABELS, getErrorMessage
} from '../../utils/helpers';
import { LoadingSpinner, EmptyState, ErrorState, PageCard, Pagination, StatusBadge } from '../../components/UI';
import ConfirmDialog from '../../components/ConfirmDialog';
import { toast } from '../../components/Toast';

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [confirm, setConfirm] = useState({ show: false, vehicleId: null, newStatus: null });

  const fetchVehicles = useCallback(async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20, search, status: statusFilter, vehicleCategory: categoryFilter };
      const res = await api.get('/vehicles', { params });
      setVehicles(res.data.data.vehicles);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, categoryFilter]);

  useEffect(() => { fetchVehicles(1); }, [fetchVehicles]);

  const handleStatusToggle = (vehicle) => {
    const newStatus = vehicle.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setConfirm({ show: true, vehicleId: vehicle.id, newStatus, vehicleNumber: vehicle.vehicleNumber });
  };

  const confirmStatusChange = async () => {
    try {
      await api.patch(`/vehicles/${confirm.vehicleId}/status`, { status: confirm.newStatus });
      toast.success(`Vehicle ${confirm.newStatus === 'ACTIVE' ? 'activated' : 'deactivated'} successfully.`);
      setConfirm({ show: false });
      fetchVehicles(pagination.page);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setConfirm({ show: false });
    }
  };

  return (
    <>
      <PageCard
        title="Vehicle List"
        subtitle={`${pagination.total} vehicle(s) total`}
        actions={
          <Link to="/vehicles/new" className="btn btn-primary btn-sm">
            <i className="bi bi-plus-lg me-1"></i> Add Vehicle
          </Link>
        }
      >
        {/* Filters */}
        <div className="row g-2 mb-3">
          <div className="col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text"><i className="bi bi-search"></i></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search vehicle number or model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select form-select-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="">All Categories</option>
              <option value="TWO_WHEELER">2 Wheeler</option>
              <option value="FOUR_WHEELER">4 Wheeler</option>
            </select>
          </div>
          <div className="col-md-1">
            <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setSearch(''); setStatusFilter(''); setCategoryFilter(''); }}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorState message={error} onRetry={() => fetchVehicles(1)} />
        ) : vehicles.length === 0 ? (
          <EmptyState icon="bi-car-front" title="No vehicles found" message="Add your first vehicle to get started." action={<Link to="/vehicles/new" className="btn btn-primary btn-sm">Add Vehicle</Link>} />
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover table-sm align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Vehicle No.</th>
                    <th>Category</th>
                    <th>Sub Category</th>
                    <th>Model Name</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v) => (
                    <tr key={v.id}>
                      <td className="fw-semibold text-primary">{v.vehicleNumber}</td>
                      <td><span className="badge bg-light text-dark border">{VEHICLE_CATEGORY_LABELS[v.vehicleCategory]}</span></td>
                      <td style={{ fontSize: '0.82rem' }}>{VEHICLE_SUB_CATEGORY_LABELS[v.subCategory]}</td>
                      <td>{v.modelName}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td className="text-end">
                        <div className="d-flex gap-1 justify-content-end">
                          <Link to={`/vehicles/${v.id}`} className="btn btn-outline-secondary btn-sm py-0 px-2" title="View/Edit">
                            <i className="bi bi-pencil"></i>
                          </Link>
                          <button
                            className={`btn btn-sm py-0 px-2 ${v.status === 'ACTIVE' ? 'btn-outline-warning' : 'btn-outline-success'}`}
                            onClick={() => handleStatusToggle(v)}
                            title={v.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          >
                            <i className={`bi ${v.status === 'ACTIVE' ? 'bi-slash-circle' : 'bi-check-circle'}`}></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Pagination page={pagination.page} totalPages={pagination.totalPages} onPageChange={(p) => fetchVehicles(p)} />
            </div>
          </>
        )}
      </PageCard>

      <ConfirmDialog
        show={confirm.show}
        title={`${confirm.newStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'} Vehicle`}
        message={`Are you sure you want to ${confirm.newStatus === 'INACTIVE' ? 'deactivate' : 'activate'} vehicle ${confirm.vehicleNumber}? ${confirm.newStatus === 'INACTIVE' ? 'Inactive vehicles will not appear in new expense forms.' : ''}`}
        confirmText={confirm.newStatus === 'INACTIVE' ? 'Deactivate' : 'Activate'}
        confirmVariant={confirm.newStatus === 'INACTIVE' ? 'warning' : 'success'}
        onConfirm={confirmStatusChange}
        onCancel={() => setConfirm({ show: false })}
      />
    </>
  );
};

export default VehicleList;
