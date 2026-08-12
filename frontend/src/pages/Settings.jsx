import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import { getErrorMessage } from '../utils/helpers';
import { PageCard } from '../components/UI';
import { toast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully.');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="row g-4">
      <div className="col-lg-6">
        <PageCard title="Account Settings">
          <div className="mb-4 p-3 rounded-2" style={{ background: '#f8fafc' }}>
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{ width: 56, height: 56, background: '#1e40af' }}
              >
                <i className="bi bi-person text-white" style={{ fontSize: '1.5rem' }}></i>
              </div>
              <div>
                <div className="fw-bold text-dark">{user?.username}</div>
                <div className="text-muted" style={{ fontSize: '0.82rem' }}>{user?.email || 'No email set'}</div>
                <span className="badge bg-primary-subtle text-primary mt-1">Administrator</span>
              </div>
            </div>
          </div>

          <h6 className="fw-bold mb-3">Change Password</h6>
          <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: '400px' }}>
            <div className="mb-3">
              <label className="form-label fw-semibold">Current Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
                {...register('currentPassword', { required: 'Current password is required.' })}
              />
              {errors.currentPassword && <div className="invalid-feedback">{errors.currentPassword.message}</div>}
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold">New Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
                {...register('newPassword', {
                  required: 'New password is required.',
                  minLength: { value: 8, message: 'Password must be at least 8 characters.' },
                })}
              />
              {errors.newPassword && <div className="invalid-feedback">{errors.newPassword.message}</div>}
            </div>
            <div className="mb-4">
              <label className="form-label fw-semibold">Confirm New Password <span className="text-danger">*</span></label>
              <input
                type="password"
                className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                {...register('confirmPassword', {
                  required: 'Please confirm your new password.',
                  validate: (val) => val === newPassword || 'Passwords do not match.',
                })}
              />
              {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword.message}</div>}
            </div>

            <button type="submit" className="btn btn-primary px-4" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-shield-lock me-1"></i>Change Password</>}
            </button>
          </form>
        </PageCard>
      </div>

      <div className="col-lg-6">
        <PageCard title="System Information">
          <div className="d-flex flex-column gap-3">
            {[
              { label: 'Application', value: 'FleetCost' },
              { label: 'Version', value: '1.0.0' },
              { label: 'Purpose', value: 'Vehicle Expense & Profitability Management' },
              { label: 'Database', value: 'PostgreSQL' },
              { label: 'Backend', value: 'Node.js + Express.js + Prisma ORM' },
              { label: 'Frontend', value: 'React + Vite + Bootstrap 5' },
            ].map((item) => (
              <div key={item.label} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                <span className="text-muted" style={{ fontSize: '0.875rem' }}>{item.label}</span>
                <span className="fw-semibold" style={{ fontSize: '0.875rem' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </PageCard>
      </div>
    </div>
  );
};

export default Settings;
