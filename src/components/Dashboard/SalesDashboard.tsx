import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SalesDataSection } from './SalesDataSection';
import { DashboardStats } from '../../types';
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Target,
  Award,
  CreditCard,
  Users,
  Calendar,
  Filter,
  BarChart3 as BarChartIcon
} from 'lucide-react';

interface SalesDashboardProps {
  onTabChange: (tab: string) => void;
}

export function SalesDashboard({ onTabChange }: SalesDashboardProps) {
  const { state } = useApp();
  const { state: authState } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'analytics'>('overview');

  function getDateRangeLabel() {
    return 'Today';
  }

  const todaySales = state.sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.createdAt);
    return saleDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const averageOrderValue = todaySales.length > 0 ? todayRevenue / todaySales.length : 0;
  const salesTarget = 80000; // Daily target in rupees
  const targetProgress = (todayRevenue / salesTarget) * 100;

  const recentSales = state.sales.slice(-8).reverse();

  if (activeView === 'analytics') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('overview')}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>← Back to Sales Overview</span>
          </button>
        </div>
        <SalesDataSection />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sales Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Sales Dashboard</h1>
            <p className="text-green-100 text-lg">Foreign Fits - Global Fashion</p>
            <p className="text-green-200 text-sm mt-1">Track your sales performance</p>
          </div>
          <div className="text-right">
            <div className="p-3 bg-green-500 rounded-full">
              <ShoppingCart className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Sales Dashboard</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'overview'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'analytics'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChartIcon className="h-4 w-4" />
              <span>Detailed Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sales ({getDateRangeLabel()})</p>
              <p className="text-3xl font-bold text-gray-900">{todaySales.length}</p>
              <p className="text-xs text-green-600 mt-1">Today's transactions</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue ({getDateRangeLabel()})</p>
              <p className="text-3xl font-bold text-green-600">₹{todayRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Today's revenue</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl text-green-600">₹</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-3xl font-bold text-purple-600">₹{averageOrderValue.toFixed(2)}</p>
              <p className="text-xs text-purple-600 mt-1">Per transaction</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Target Progress</p>
              <p className="text-3xl font-bold text-orange-600">{targetProgress.toFixed(0)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(targetProgress, 100)}%` }}
                />
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            Recent Sales
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales yet.</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">#{sale.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-600">
                      {sale.items.length} items • {sale.customerName || 'Walk-in'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">₹{sale.total.toFixed(2)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                      sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {sale.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-purple-500 mr-2" />
            Today's Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-medium text-blue-900">Sales Target</span>
              <span className="text-lg font-bold text-blue-600">₹{salesTarget}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-medium text-green-900">Progress</span>
              <span className="text-lg font-bold text-green-600">{targetProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(targetProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-medium text-purple-900">Avg Order</span>
              <span className="text-lg font-bold text-purple-600">${averageOrderValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 text-orange-500 mr-2" />
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button 
              onClick={() => setActiveView('analytics')}
              className="w-full p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <BarChartIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900 text-sm">View Analytics</p>
                  <p className="text-xs text-blue-600">Detailed sales reports</p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => onTabChange('sales')}
              className="w-full p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <ShoppingCart className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 text-sm">New Sale</p>
                  <p className="text-xs text-green-600">Start selling</p>
                </div>
              </div>
            </button>
            <button className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-purple-900 text-sm">Customer Info</p>
                  <p className="text-xs text-purple-600">Manage customers</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Goals */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Goals & Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">₹{todayRevenue.toFixed(0)}</div>
            <div className="text-sm text-gray-600 mb-2">Revenue Today</div>
            <div className="text-xs text-green-600">Goal: ₹80,000</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">{todaySales.length}</div>
            <div className="text-sm text-gray-600 mb-2">Transactions Today</div>
            <div className="text-xs text-blue-600">Goal: 15 sales</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-1">₹{averageOrderValue.toFixed(0)}</div>
            <div className="text-sm text-gray-600 mb-2">Avg Order Value</div>
            <div className="text-xs text-purple-600">Goal: ₹6,000</div>
          </div>
        </div>
      </div>
    </div>
  );
}