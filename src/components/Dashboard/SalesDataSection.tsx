import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Filter,
  Download,
  Eye,
  CreditCard,
  Clock,
  Users,
  Target
} from 'lucide-react';

export function SalesDataSection() {
  const { state } = useApp();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'card' | 'other'>('all');
  const [showDetails, setShowDetails] = useState(false);

  const getFilteredSales = () => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (dateFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date(weekStart);
        endDate.setDate(weekStart.getDate() + 6);
        endDate.setHours(23, 59, 59);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        break;
      case 'custom':
        if (!customStartDate || !customEndDate) return state.sales;
        startDate = new Date(customStartDate + 'T00:00:00');
        endDate = new Date(customEndDate + 'T23:59:59');
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    }

    let filtered = state.sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= startDate && saleDate <= endDate;
    });

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(sale => sale.paymentMethod === paymentFilter);
    }

    return filtered;
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTax = filteredSales.reduce((sum, sale) => sum + sale.tax, 0);
  const averageOrderValue = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;
  const totalItems = filteredSales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);

  const getDateRangeLabel = () => {
    switch (dateFilter) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': 
        if (!customStartDate || !customEndDate) return 'Custom Range';
        return `${new Date(customStartDate).toLocaleDateString()} - ${new Date(customEndDate).toLocaleDateString()}`;
      default: return 'Today';
    }
  };

  const getPaymentMethodStats = () => {
    return filteredSales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const getHourlyData = () => {
    const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      sales: 0,
      revenue: 0
    }));

    filteredSales.forEach(sale => {
      const hour = new Date(sale.createdAt).getHours();
      hourlyStats[hour].sales += 1;
      hourlyStats[hour].revenue += sale.total;
    });

    return hourlyStats.filter(stat => stat.sales > 0);
  };

  const getTopProducts = () => {
    const productStats = filteredSales.reduce((acc, sale) => {
      sale.items.forEach(item => {
        const productId = item.product.id;
        if (!acc[productId]) {
          acc[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0
          };
        }
        acc[productId].quantity += item.quantity;
        acc[productId].revenue += item.total;
      });
      return acc;
    }, {} as Record<string, any>);

    return Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const exportSalesData = () => {
    const csvContent = [
      ['Date', 'Time', 'Sale ID', 'Customer', 'Items', 'Subtotal', 'Tax', 'Total', 'Payment Method'].join(','),
      ...filteredSales.map(sale => [
        new Date(sale.createdAt).toLocaleDateString(),
        new Date(sale.createdAt).toLocaleTimeString(),
        sale.id,
        `"${sale.customerName || 'Walk-in'}"`,
        sale.items.length,
        sale.subtotal.toFixed(2),
        sale.tax.toFixed(2),
        sale.total.toFixed(2),
        sale.paymentMethod
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-data-${getDateRangeLabel().replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const paymentMethodStats = getPaymentMethodStats();
  const hourlyData = getHourlyData();
  const topProducts = getTopProducts();

  return (
    <div className="space-y-6">
      {/* Sales Data Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Sales Analytics</h2>
            <p className="text-blue-100 text-lg">Foreign Fits - Global Fashion</p>
            <p className="text-blue-200 text-sm mt-1">Comprehensive sales data and insights</p>
          </div>
          <div className="text-right">
            <div className="p-3 bg-blue-500 rounded-full">
              <BarChart3 className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Sales Period: {getDateRangeLabel()}
              {paymentFilter !== 'all' && ` • ${paymentFilter.charAt(0).toUpperCase() + paymentFilter.slice(1)} only`}
            </h3>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Date Filter */}
            <div className="flex space-x-2">
              {[
                { value: 'today', label: 'Today' },
                { value: 'week', label: 'This Week' },
                { value: 'month', label: 'This Month' },
                { value: 'custom', label: 'Custom' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDateFilter(value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    dateFilter === value
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payments</option>
              <option value="cash">Cash Only</option>
              <option value="card">Card Only</option>
              <option value="other">Other Only</option>
            </select>
            
            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}

            <button
              onClick={exportSalesData}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-3xl font-bold text-blue-600">{filteredSales.length}</p>
              <p className="text-xs text-blue-600 mt-1">Transactions</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">₹{totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Gross sales</p>
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
              <p className="text-sm font-medium text-gray-600">Items Sold</p>
              <p className="text-3xl font-bold text-orange-600">{totalItems}</p>
              <p className="text-xs text-orange-600 mt-1">Total units</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Methods Breakdown */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CreditCard className="h-5 w-5 text-indigo-500 mr-2" />
            Payment Methods
          </h3>
          <div className="space-y-4">
            {Object.entries(paymentMethodStats).map(([method, count]) => {
              const total = Object.values(paymentMethodStats).reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? (count / total) * 100 : 0;
              const revenue = filteredSales
                .filter(sale => sale.paymentMethod === method)
                .reduce((sum, sale) => sum + sale.total, 0);
              
              return (
                <div key={method} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">{method}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{count} sales</span>
                      <span className="text-xs text-gray-500 block">${revenue.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        method === 'cash' ? 'bg-green-500' :
                        method === 'card' ? 'bg-blue-500' : 'bg-gray-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of transactions</div>
                </div>
              );
            })}
            {Object.keys(paymentMethodStats).length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No payment data available for selected period.</p>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 text-emerald-500 mr-2" />
            Top Products by Revenue
          </h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">No sales data available for selected period.</p>
            ) : (
              topProducts.map((item: any, index) => (
                <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                      <p className="text-xs text-gray-600">{item.product.size} - {item.product.color}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">${item.revenue.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{item.quantity} units</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hourly Sales Pattern */}
      {hourlyData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            Sales by Hour
          </h3>
          <div className="grid grid-cols-12 gap-2">
            {hourlyData.map((data) => (
              <div key={data.hour} className="text-center">
                <div 
                  className="bg-blue-500 rounded-t mx-auto mb-1 transition-all duration-300 hover:bg-blue-600"
                  style={{ 
                    height: `${Math.max((data.sales / Math.max(...hourlyData.map(h => h.sales))) * 60, 4)}px`,
                    width: '20px'
                  }}
                  title={`${data.hour}:00 - ${data.sales} sales, $${data.revenue.toFixed(2)}`}
                />
                <div className="text-xs text-gray-600">{data.hour}</div>
                <div className="text-xs font-medium text-gray-900">{data.sales}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-gray-500 text-center">
            Hover over bars to see details • Hours with no sales are hidden
          </div>
        </div>
      )}

      {/* Detailed Sales List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Eye className="h-5 w-5 text-gray-500 mr-2" />
              Sales Details ({filteredSales.length} transactions)
            </h3>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
            >
              <Eye className="h-4 w-4" />
              <span>{showDetails ? 'Hide' : 'Show'} Details</span>
            </button>
          </div>
        </div>

        {showDetails && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sale ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No sales found for the selected criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSales.slice().reverse().map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(sale.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-mono text-gray-900">
                          #{sale.id.slice(0, 8)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {sale.customerName || 'Walk-in Customer'}
                        </div>
                        {sale.customerEmail && (
                          <div className="text-xs text-gray-500">{sale.customerEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {sale.items.length} item{sale.items.length > 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-gray-500">
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)} units
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          sale.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' :
                          sale.paymentMethod === 'card' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-green-600">
                          ${sale.total.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Tax: ${sale.tax.toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}