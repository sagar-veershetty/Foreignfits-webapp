import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { SalesDataSection } from './SalesDataSection';
import { BarcodePrinter } from '../Barcode/BarcodePrinter';
import { DashboardStats } from '../../types';
import { 
  Package, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  Users, 
  ShoppingCart,
  BarChart3,
  Settings,
  Printer,
  Calendar,
  Filter,
  BarChart3 as BarChartIcon
} from 'lucide-react';

interface AdminDashboardProps {
  onTabChange: (tab: string) => void;
}

export function AdminDashboard({ onTabChange }: AdminDashboardProps) {
  const { state } = useApp();
  const { state: authState } = useAuth();
  const [activeView, setActiveView] = useState<'overview' | 'sales'>('overview');
  const [showPrinter, setShowPrinter] = useState(false);
  
  function getDateRangeLabel() {
    return 'All Time';
  }

  const stats: DashboardStats = {
    totalProducts: state.products.length,
    lowStockItems: state.products.filter(p => p.stock <= p.minStock).length,
    todaySales: state.sales.filter(sale => {
      const today = new Date();
      const saleDate = new Date(sale.createdAt);
      return saleDate.toDateString() === today.toDateString();
    }).length,
    totalRevenue: state.sales.reduce((sum, sale) => sum + sale.total, 0),
  };

  const lowStockProducts = state.products.filter(p => p.stock <= p.minStock);
  const recentSales = state.sales.slice(-5).reverse();
  const topSellingCategories = getTopSellingCategories();
  const profitMargin = calculateProfitMargin();

  function getTopSellingCategories() {
    const categoryStats = state.sales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const category = item.product.category;
        acc[category] = (acc[category] || 0) + item.quantity;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }

  function calculateProfitMargin() {
    const totalRevenue = state.sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCost = state.sales.reduce((sum, sale) => 
      sum + sale.items.reduce((itemSum, item) => 
        itemSum + (item.product.cost * item.quantity), 0), 0);
    
    return totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100) : 0;
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'add-product':
        onTabChange('add-product');
        break;
      case 'new-sale':
        onTabChange('sales');
        break;
      case 'print-labels':
        setShowPrinter(true);
        break;
      case 'view-reports':
        setActiveView('sales');
        break;
      default:
        break;
    }
  };

  if (showPrinter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPrinter(false)}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
          >
            <Settings className="h-4 w-4" />
            <span>← Back to Dashboard</span>
          </button>
        </div>
        <BarcodePrinter />
      </div>
    );
  }

  if (activeView === 'sales') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveView('overview')}
            className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
          >
            <Settings className="h-4 w-4" />
            <span>← Back to Overview</span>
          </button>
        </div>
        <SalesDataSection />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-purple-100 text-lg">Foreign Fits - Global Fashion</p>
            <p className="text-purple-200 text-sm mt-1">Complete Business Overview</p>
          </div>
          <div className="text-right">
            <div className="p-3 bg-purple-500 rounded-full">
              <Settings className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Business Dashboard</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('overview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveView('sales')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === 'sales'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChartIcon className="h-4 w-4" />
              <span>Sales Analytics</span>
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revenue ({getDateRangeLabel()})</p>
              <p className="text-3xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">+8% from last month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">₹</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Profit Margin</p>
              <p className="text-3xl font-bold text-emerald-600">{profitMargin.toFixed(1)}%</p>
              <p className="text-xs text-emerald-600 mt-1">+2.3% from last month</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-amber-600">{stats.lowStockItems}</p>
              <p className="text-xs text-red-600 mt-1">Needs attention</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Business Analytics */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-purple-500 mr-2" />
            Top Selling Categories
          </h3>
          <div className="space-y-3">
            {topSellingCategories.map(([category, count], index) => (
              <div key={category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    index === 0 ? 'bg-purple-500' :
                    index === 1 ? 'bg-blue-500' :
                    index === 2 ? 'bg-green-500' :
                    index === 3 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count} sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Critical Stock Levels
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">All products are well-stocked!</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-600">{product.size} - {product.color}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-amber-600">{product.stock}</p>
                    <p className="text-xs text-gray-500">Min: {product.minStock}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <ShoppingCart className="h-5 w-5 text-green-500 mr-2" />
            Recent Transactions
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-sm">No sales yet today.</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Sale #{sale.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-600">
                      {sale.items.length} item{sale.items.length > 1 ? 's' : ''} • {sale.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 text-sm">₹{sale.total.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(sale.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('add-product')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
          >
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-900">Add Product</span>
          </button>
          <button 
            onClick={() => handleQuickAction('new-sale')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
          >
            <ShoppingCart className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-900">New Sale</span>
          </button>
          <button 
            onClick={() => handleQuickAction('print-labels')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
          >
            <Printer className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-900">Print Labels</span>
          </button>
          <button 
            onClick={() => handleQuickAction('view-reports')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
          >
            <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-900">View Reports</span>
          </button>
        </div>
      </div>
    </div>
  );
}