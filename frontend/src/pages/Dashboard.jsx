import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend, PointElement, LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';
import { formatCurrency, MONTHS } from '../utils/helpers';
import { LoadingSpinner, ErrorState, SummaryCard } from '../components/UI';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, PointElement, LineElement);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const { summary, categoryBreakdown, vehicles, monthlyTrend, year } = data;

  const chartColors = {
    washing: '#7c3aed',
    fuel: '#ea580c',
    service: '#0891b2',
    office: '#65a30d',
  };

  const doughnutData = {
    labels: ['Washing', 'Fuel', 'Vehicle Service', 'Office'],
    datasets: [{
      data: [
        categoryBreakdown.washing,
        categoryBreakdown.fuel,
        categoryBreakdown.service,
        categoryBreakdown.office,
      ],
      backgroundColor: [chartColors.washing, chartColors.fuel, chartColors.service, chartColors.office],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const barData = {
    labels: MONTHS.map((m) => m.substring(0, 3)),
    datasets: [{
      label: `Expenses (${year})`,
      data: monthlyTrend.map((m) => m.total),
      backgroundColor: '#bfdbfe',
      hoverBackgroundColor: '#1e40af',
      borderRadius: 6,
      borderSkipped: false,
    }],
  };

  const paidUnpaidData = {
    labels: ['Paid', 'Unpaid'],
    datasets: [{
      data: [summary.totalPaid, summary.totalUnpaid],
      backgroundColor: ['#16a34a', '#dc2626'],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: { color: '#f1f5f9' },
        ticks: { callback: (v) => '₹' + (v / 1000).toFixed(0) + 'k', font: { size: 11 } },
      },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, padding: 10, font: { size: 11 } },
      },
    },
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-4 col-lg">
          <SummaryCard label="Today's Expense" value={formatCurrency(summary.todayExpense)} icon="bi-calendar-day" color="#1e40af" bgColor="#eff6ff" />
        </div>
        <div className="col-6 col-md-4 col-lg">
          <SummaryCard label="This Month" value={formatCurrency(summary.monthExpense)} icon="bi-calendar3" color="#7c3aed" bgColor="#f5f3ff" />
        </div>
        <div className="col-6 col-md-4 col-lg">
          <SummaryCard label="Total Expense" value={formatCurrency(summary.totalExpense)} icon="bi-graph-up" color="#0891b2" bgColor="#ecfeff" />
        </div>
        <div className="col-6 col-md-4 col-lg">
          <SummaryCard label="Total Paid" value={formatCurrency(summary.totalPaid)} icon="bi-check-circle" color="#16a34a" bgColor="#f0fdf4" />
        </div>
        <div className="col-6 col-md-4 col-lg">
          <SummaryCard label="Total Unpaid" value={formatCurrency(summary.totalUnpaid)} icon="bi-exclamation-circle" color="#dc2626" bgColor="#fef2f2" />
        </div>
      </div>

      {/* Category + Vehicles Row */}
      <div className="row g-3 mb-4">
        <div className="col-md-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom d-flex align-items-center justify-content-between py-3 px-4">
              <div>
                <h6 className="mb-0 fw-bold">Expense Categories</h6>
                <small className="text-muted">All time breakdown</small>
              </div>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {[
                  { label: 'Washing', value: categoryBreakdown.washing, color: chartColors.washing, icon: 'bi-droplet', path: '/expenses/washing' },
                  { label: 'Fuel', value: categoryBreakdown.fuel, color: chartColors.fuel, icon: 'bi-fuel-pump', path: '/expenses/fuel' },
                  { label: 'Vehicle Service', value: categoryBreakdown.service, color: chartColors.service, icon: 'bi-tools', path: '/expenses/service' },
                  { label: 'Office', value: categoryBreakdown.office, color: chartColors.office, icon: 'bi-building', path: '/expenses/office' },
                ].map((item) => (
                  <div className="col-6" key={item.label}>
                    <Link to={item.path} className="text-decoration-none">
                      <div
                        className="d-flex align-items-center gap-3 p-3 rounded-3"
                        style={{ background: `${item.color}12`, border: `1px solid ${item.color}30` }}
                      >
                        <div
                          className="d-flex align-items-center justify-content-center rounded-2"
                          style={{ width: 40, height: 40, background: `${item.color}20` }}
                        >
                          <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: '1.2rem' }}></i>
                        </div>
                        <div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.label}</div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{formatCurrency(item.value)}</div>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h6 className="mb-0 fw-bold">Vehicles</h6>
              <small className="text-muted">Fleet overview</small>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              <div className="text-center mb-3">
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e40af', lineHeight: 1 }}>
                  {vehicles.active}
                </div>
                <div className="text-muted" style={{ fontSize: '0.8rem' }}>Active Vehicles</div>
              </div>
              <div className="w-100">
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Active</span>
                  <span className="fw-semibold text-success">{vehicles.active}</span>
                </div>
                <div className="progress mb-3" style={{ height: '6px' }}>
                  <div
                    className="progress-bar bg-success"
                    style={{ width: vehicles.total > 0 ? `${(vehicles.active / vehicles.total) * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="d-flex justify-content-between small mb-1">
                  <span className="text-muted">Total</span>
                  <span className="fw-semibold">{vehicles.total}</span>
                </div>
              </div>
              <Link to="/vehicles" className="btn btn-outline-primary btn-sm mt-3 w-100">
                <i className="bi bi-car-front me-1"></i> Manage Vehicles
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-bottom py-3 px-4">
              <h6 className="mb-0 fw-bold">Monthly Expense Trend — {year}</h6>
              <small className="text-muted">All expense types combined</small>
            </div>
            <div className="card-body" style={{ height: '280px' }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="row g-3 h-100">
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <h6 className="mb-0 fw-bold">By Type</h6>
                </div>
                <div className="card-body" style={{ height: '125px' }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card border-0 shadow-sm">
                <div className="card-header bg-white border-bottom py-3 px-4">
                  <h6 className="mb-0 fw-bold">Paid vs Unpaid</h6>
                </div>
                <div className="card-body" style={{ height: '125px' }}>
                  <Doughnut data={paidUnpaidData} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
