import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockMovement } from '../../types';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  RotateCcw,
  AlertTriangle,
  Truck,
  Filter,
  Download
} from 'lucide-react';

export function StockMovementHistory() {
  const { state } = useApp();
  const [filterType, setFilterType] = useState<string>('all');
  const [filterProduct, setFilterProduct] = useState('');
  const [dateRange, setDateRange] = useState('7'); // days

  const filteredMovements = state.stockMovements.filter(movement => {
    const matchesType = filterType === 'all' || movement.type === filterType;
    const matchesProduct = !filterProduct || 
      movement.product.name.toLowerCase().includes(filterProduct.toLowerCase()) ||
      movement.product.sku.toLowerCase().includes(filterProduct.toLowerCase());
    
    const daysAgo = parseInt(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    const matchesDate = dateRange === 'all' || movement.createdAt >= cutoffDate;
    
    return matchesType && matchesProduct && matchesDate;
  });

  const getMovementIcon = (type: StockMovement['type']) => {
    switch (type) {
      case 'adjustment': return <RotateCcw className="h-4 w-4" />;
      case 'sale': return <ShoppingCart className="h-4 w-4" />;
      case 'return': return <TrendingUp className="h-4 w-4" />;
      case 'damage': return <AlertTriangle className="h-4 w-4" />;
      case 'transfer': return <Truck className="h-4 w-4" />;
      case 'restock': return <Package className="h-4 w-4" />;
      default: return <History className="h-4 w-4" />;
    }
  };

  const getMovementColor = (type: StockMovement['type'], quantity: number) => {
    if (quantity > 0) return 'text-green-600 bg-green-50 border-green-200';
    if (quantity < 0) return 'text-red-600 bg-red-50 border-red-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getTypeColor = (type: StockMovement['type']) => {
    switch (type) {
      case 'adjustment': return 'bg-blue-100 text-blue-800';
      case 'sale': return 'bg-green-100 text-green-800';
      case 'return': return 'bg-purple-100 text-purple-800';
      case 'damage': return 'bg-red-100 text-red-800';
      case 'transfer': return 'bg-orange-100 text-orange-800';
      case 'restock': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportMovements = () => {
    const csvContent = [
      ['Date', 'Product', 'SKU', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Reason', 'Reference', 'Created By'].join(','),
      ...filteredMovements.map(movement => [
        movement.createdAt.toLocaleString(),
        `"${movement.product.name}"`,
        movement.product.sku,
        movement.type,
        movement.quantity,
        movement.previousStock,
        movement.newStock,
        `"${movement.reason || ''}"`,
        `"${movement.reference || ''}"`,
        `"${movement.createdBy}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-movements-${new Date().toISOString().split('T')[0]}.csv`;
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
              Stock Movement History
            </h2>
            <p className="text-gray-600 mt-1">Track all inventory changes and movements</p>
          </div>
          <button
            onClick={exportMovements}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="adjustment">Adjustments</option>
              <option value="sale">Sales</option>
              <option value="return">Returns</option>
              <option value="damage">Damage</option>
              <option value="transfer">Transfers</option>
              <option value="restock">Restocks</option>
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
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Product</label>
            <input
              type="text"
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              placeholder="Search by product name or SKU..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Movements</p>
                <p className="text-2xl font-bold text-blue-900">{filteredMovements.length}</p>
              </div>
              <History className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Stock Increases</p>
                <p className="text-2xl font-bold text-green-900">
                  {filteredMovements.filter(m => m.quantity > 0).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Stock Decreases</p>
                <p className="text-2xl font-bold text-red-900">
                  {filteredMovements.filter(m => m.quantity < 0).length}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Net Change</p>
                <p className="text-2xl font-bold text-purple-900">
                  {filteredMovements.reduce((sum, m) => sum + m.quantity, 0)}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Movement List */}
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
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No stock movements found for the selected criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movement.createdAt.toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.createdAt.toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {movement.product.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {movement.product.sku} - {movement.product.size} - {movement.product.color}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded-full ${getTypeColor(movement.type)}`}>
                          {getMovementIcon(movement.type)}
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(movement.type)}`}>
                          {movement.type}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getMovementColor(movement.type, movement.quantity)}`}>
                        {movement.quantity > 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {movement.previousStock} → {movement.newStock}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{movement.reason}</div>
                      {movement.reference && (
                        <div className="text-xs text-gray-500">Ref: {movement.reference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {movement.createdBy}
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