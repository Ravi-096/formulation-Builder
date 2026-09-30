import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PublicRoute from './PublicRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import OverviewView from '../pages/dashboard/OverviewView';
import FormulationBuilderView from '../pages/dashboard/FormulationBuilderView';
import SettingsView from '../pages/dashboard/SettingsView';
import NotFoundPage from '../pages/NotFoundPage';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Dashboard Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<OverviewView />} />
          <Route path="overview" element={<OverviewView />} />
          <Route path="formulation" element={<FormulationBuilderView />} />
          <Route path="analytics" element={<Navigate to="/dashboard/overview" replace />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Route>

      {/* Root redirect: land directly on /login when user opens website */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 404 Catch-All Route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
