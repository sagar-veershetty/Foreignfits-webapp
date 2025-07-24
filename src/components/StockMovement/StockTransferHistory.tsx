import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { StockTransfer } from '../../types';
import { 
  History, 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Download,
  Eye,
  Package
} from 'lucide-react';

export function StockTransferHistory() {
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState('');
  const [dateRange, setDateRange] = useState('7'); // days

  const isAdmin = authState.user?.role === 'admin';
  const isWarehouse = authState.user?.role === 'warehouse';

  const filteredTransfers = state.stockTransfers?.filter(transfer => {
    const matchesStatus = filterStatus === 'all' || transfer.status === filterStatus;
    const matchesLocation = !filterLocation || 
      transfer.fromLocationId === filterLocation || 
      transfer.toLocationId === filterLocation;
    
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const matchesDate = dateRange === 'all' || transfer.requestedAt >= cutoffDate;
    
    return matchesStatus && matchesLocation && matchesDate;
  }) || [];

  const getStatusIcon = (status: StockTransfer['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'in_transit': return <Truck className="h-4 w-4 text-blue-600" />;
      case 'cancelled': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: StockTransfer['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_transit': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleApproveTransfer = (transferId: string) => {
    if (isAdmin) {
      dispatch({ 
        type: 'APPROVE_STOCK_TRANSFER', 
        payload: { 
          transferId, 
          approvedBy: authState.user?.name || 'Unknown',
          approvedById: authState.user?.id || 'unknown'
        } 
      });
    }
  };

  const handleCompleteTransfer = (transferId: string) => {
    if (isAdmin || isWarehouse) {
      dispatch({ 
        type: 'COMPLETE_STOCK_TRANSFER', 
        payload: { 
          transferId, 
          completedBy: authState.user?.name || 'Unknown',
          completedById: authState.user?.id || 'unknown'
        } 
      });
    }
  };

  const exportTransfers = () => {
    const csvContent = [
      ['Date', 'Product', 'From Location', 'To Location', 'Quantity', 'Status', 'Requested By', 'Reason'].join(','),
      ...filteredTransfers.map(transfer => [
        transfer.requestedAt.toLocaleDateString(),
        `"${transfer.product.name}"`,
        `"${transfer.fromLocation.name}"`,
        `"${transfer.toLocation.name}"`,
        transfer.quantity,
        transfer.status,
        `"${transfer.requestedBy}"`,
        `"${transfer.reason}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-transfers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <History className="h-6 w-6 mr-2 text-blue-600" />
              Stock Transfer History
            </h2>
            <p className="text-gray-600 mt-1">Track all inventory transfers between locations</p>
          </div>
          <button
            onClick={exportTransfers}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_transit">In Transit</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">All Locations</option>
              {state.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="1">Last 24 hours</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Transfers</p>
                <p className="text-2xl font-bold text-blue-900">{filteredTransfers.length}</p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {filteredTransfers.filter(t => t.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredTransfers.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Items Moved</p>
                <p className="text-2xl font-bold text-purple-900">
                  {filteredTransfers.reduce((sum, t) => sum + t.quantity, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Transfer List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transfer Route
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No stock transfers found for the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {transfer.requestedAt.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transfer.requestedAt.toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transfer.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transfer.product.sku} - {transfer.product.size} - {transfer.product.color}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{transfer.fromLocation.name}</div>
                          <div className="text-xs text-gray-500">{transfer.fromLocation.type}</div>
                        </div>
                        <Truck className="h-4 w-4 text-gray-400" />
                        <div className="text-center">
                          <div className="text-sm font-medium text-gray-900">{transfer.toLocation.name}</div>
                          <div className="text-xs text-gray-500">{transfer.toLocation.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">{transfer.quantity}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transfer.status)}
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(transfer.status)}`}>
                          {transfer.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transfer.requestedBy}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {transfer.status === 'pending' && isAdmin && (
                          <button
                            onClick={() => handleApproveTransfer(transfer.id)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                          >
                            Approve
                          </button>
                        )}
                        {transfer.status === 'in_transit' && (isAdmin || isWarehouse) && (
                          <button
                            onClick={() => handleCompleteTransfer(transfer.id)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        <button className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                          <Eye className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}