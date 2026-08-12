import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from './components/Toast';
import ProtectedRoute from './routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import VehicleList from './pages/vehicles/VehicleList';
import VehicleForm from './pages/vehicles/VehicleForm';
import AllExpenses from './pages/expenses/AllExpenses';
import ExpenseForm from './pages/expenses/ExpenseForm';
import Parties from './pages/Parties';
import Revenue from './pages/Revenue';
import MonthlyReport from './pages/reports/MonthlyReport';
import YearlyReport from './pages/reports/YearlyReport';
import VehicleExpenseReport from './pages/reports/VehicleExpenseReport';
import ProfitabilityReport from './pages/reports/ProfitabilityReport';
import ImportExport from './pages/ImportExport';
import Settings from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastContainer />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            {/* Vehicles */}
            <Route path="vehicles" element={<VehicleList />} />
            <Route path="vehicles/new" element={<VehicleForm />} />
            <Route path="vehicles/:id" element={<VehicleForm />} />

            {/* Expenses */}
            <Route path="expenses" element={<AllExpenses />} />
            <Route path="expenses/washing" element={<AllExpenses filterType="WASHING" />} />
            <Route path="expenses/fuel" element={<AllExpenses filterType="FUEL" />} />
            <Route path="expenses/service" element={<AllExpenses filterType="VEHICLE_SERVICE" />} />
            <Route path="expenses/office" element={<AllExpenses filterType="OFFICE" />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
            <Route path="expenses/:id/edit" element={<ExpenseForm />} />

            {/* Parties */}
            <Route path="parties" element={<Parties />} />

            {/* Revenue */}
            <Route path="revenue" element={<Revenue />} />

            {/* Reports */}
            <Route path="reports/monthly" element={<MonthlyReport />} />
            <Route path="reports/yearly" element={<YearlyReport />} />
            <Route path="reports/vehicle-expense" element={<VehicleExpenseReport />} />
            <Route path="reports/profitability" element={<ProfitabilityReport />} />

            {/* Import / Export */}
            <Route path="import-export" element={<ImportExport />} />

            {/* Settings */}
            <Route path="settings" element={<Settings />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
