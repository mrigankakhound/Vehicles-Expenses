import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await login(data.username, data.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #1d4ed8 100%)',
      }}
    >
      <div className="w-100" style={{ maxWidth: '420px', padding: '0 16px' }}>
        {/* Logo / Brand */}
        <div className="text-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
            style={{ width: 72, height: 72, background: 'rgba(255,255,255,0.15)' }}
          >
            <i className="bi bi-truck text-white" style={{ fontSize: '2.2rem' }}></i>
          </div>
          <h2 className="text-white fw-bold mb-1">FleetCost</h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
            Vehicle Expense & Profitability Management
          </p>
        </div>

        {/* Login Card */}
        <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
          <div className="card-body p-4 p-md-5">
            <h5 className="fw-bold text-dark mb-1">Welcome back</h5>
            <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
              Sign in to your account to continue
            </p>

            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2" style={{ fontSize: '0.875rem' }}>
                <i className="bi bi-exclamation-circle flex-shrink-0"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                  Username
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-person text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className={`form-control border-start-0 bg-light ${errors.username ? 'is-invalid' : ''}`}
                    placeholder="Enter username"
                    {...register('username', { required: 'Username is required.' })}
                  />
                  {errors.username && (
                    <div className="invalid-feedback">{errors.username.message}</div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: '0.875rem' }}>
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-lock text-muted"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control border-start-0 border-end-0 bg-light ${errors.password ? 'is-invalid' : ''}`}
                    placeholder="Enter password"
                    {...register('password', { required: 'Password is required.' })}
                  />
                  <button
                    type="button"
                    className="input-group-text bg-light border-start-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                  </button>
                  {errors.password && (
                    <div className="invalid-feedback">{errors.password.message}</div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold"
                disabled={loading}
                style={{ borderRadius: '8px', fontSize: '0.95rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="bi bi-box-arrow-in-right me-2"></i>
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <p className="text-center mt-3" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
          FleetCost &copy; {new Date().getFullYear()} — Secure Business Application
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
