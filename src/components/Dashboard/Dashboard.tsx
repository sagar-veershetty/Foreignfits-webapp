import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { SalesDashboard } from './SalesDashboard';
import { WarehouseDashboard } from './WarehouseDashboard';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export function Dashboard({ onTabChange }: DashboardProps) {
  const { state: authState } = useAuth();

  switch (authState.user?.role) {
    case 'admin':
      return <AdminDashboard onTabChange={onTabChange} />;
    case 'sales':
      return <SalesDashboard onTabChange={onTabChange} />;
    case 'warehouse':
      return <WarehouseDashboard onTabChange={onTabChange} />;
    default:
      return <AdminDashboard onTabChange={onTabChange} />;
  }
}