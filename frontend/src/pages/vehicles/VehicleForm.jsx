import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import {
  VEHICLE_CATEGORY_LABELS, VEHICLE_SUB_CATEGORY_LABELS, getErrorMessage
} from '../../utils/helpers';
import { LoadingSpinner, PageCard } from '../../components/UI';
import { toast } from '../../components/Toast';

const FOUR_WHEELER_SUBS = ['HATCHBACK','SEDAN','SUV','COMPACT_SUV','MUV'];
const TWO_WHEELER_SUBS = ['MOTORCYCLE_ABOVE_200CC','SCOOTY_ABOVE_125CC','MOTORCYCLE_BELOW_200CC','SCOOTY_BELOW_110CC'];

const VehicleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: { vehicleCategory: 'FOUR_WHEELER', status: 'ACTIVE' }
  });

  const selectedCategory = watch('vehicleCategory');
  const subCategories = selectedCategory === 'FOUR_WHEELER' ? FOUR_WHEELER_SUBS : TWO_WHEELER_SUBS;

  useEffect(() => {
    if (isEdit) {
      api.get(`/vehicles/${id}`)
        .then((res) => {
          const v = res.data.data.vehicle;
          setValue('vehicleNumber', v.vehicleNumber);
          setValue('vehicleCategory', v.vehicleCategory);
          setValue('subCategory', v.subCategory);
          setValue('modelName', v.modelName);
          setValue('status', v.status);
        })
        .catch(() => toast.error('Failed to load vehicle.'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, setValue]);

  // Reset subCategory when category changes
  useEffect(() => {
    setValue('subCategory', subCategories[0]);
  }, [selectedCategory]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/vehicles/${id}`, data);
        toast.success('Vehicle updated successfully.');
      } else {
        await api.post('/vehicles', data);
        toast.success('Vehicle created successfully.');
        navigate('/vehicles');
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <PageCard
      title={isEdit ? 'Edit Vehicle' : 'Add New Vehicle'}
      actions={
        <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/vehicles')}>
          <i className="bi bi-arrow-left me-1"></i> Back to List
        </button>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '600px' }}>
        <div className="row g-3">
          <div className="col-md-6">
            <label className="form-label fw-semibold">Vehicle Number <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control text-uppercase ${errors.vehicleNumber ? 'is-invalid' : ''}`}
              placeholder="e.g. AS01AB1234"
              {...register('vehicleNumber', {
                required: 'Vehicle number is required.',
                minLength: { value: 2, message: 'Minimum 2 characters.' },
                maxLength: { value: 20, message: 'Maximum 20 characters.' },
              })}
            />
            {errors.vehicleNumber && <div className="invalid-feedback">{errors.vehicleNumber.message}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Model Name <span className="text-danger">*</span></label>
            <input
              type="text"
              className={`form-control ${errors.modelName ? 'is-invalid' : ''}`}
              placeholder="e.g. Maruti Swift"
              {...register('modelName', { required: 'Model name is required.' })}
            />
            {errors.modelName && <div className="invalid-feedback">{errors.modelName.message}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Vehicle Category <span className="text-danger">*</span></label>
            <select className="form-select" {...register('vehicleCategory', { required: true })}>
              {Object.entries(VEHICLE_CATEGORY_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Sub Category <span className="text-danger">*</span></label>
            <select className={`form-select ${errors.subCategory ? 'is-invalid' : ''}`} {...register('subCategory', { required: 'Sub category is required.' })}>
              {subCategories.map((val) => (
                <option key={val} value={val}>{VEHICLE_SUB_CATEGORY_LABELS[val]}</option>
              ))}
            </select>
            {errors.subCategory && <div className="invalid-feedback">{errors.subCategory.message}</div>}
          </div>

          <div className="col-md-6">
            <label className="form-label fw-semibold">Status</label>
            <select className="form-select" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="d-flex gap-2 mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={saving}>
            {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-check-lg me-1"></i>{isEdit ? 'Update Vehicle' : 'Add Vehicle'}</>}
          </button>
          <button type="button" className="btn btn-light px-4" onClick={() => navigate('/vehicles')}>Cancel</button>
        </div>
      </form>
    </PageCard>
  );
};

export default VehicleForm;
