import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { BarcodePrinter } from '../Barcode/BarcodePrinter';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Truck,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Printer
} from 'lucide-react';

interface WarehouseDashboardProps {
  onTabChange: (tab: string) => void;
}

export function WarehouseDashboard({ onTabChange }: WarehouseDashboardProps) {
  const { state } = useApp();
  const { state: authState } = useAuth();
  const [showPrinter, setShowPrinter] = React.useState(false);
  
  const lowStockProducts = state.products.filter(p => p.stock <= p.minStock);
  const outOfStockProducts = state.products.filter(p => p.stock === 0);
  const wellStockedProducts = state.products.filter(p => p.stock > p.minStock);
  
  const totalStockValue = state.products.reduce((sum, product) => 
    sum + (product.stock * product.cost), 0);
  
  const categoryStockLevels = getCategoryStockLevels();
  const recentStockMovements = getRecentStockMovements();
  const restockAlerts = getRestockAlerts();

  function getCategoryStockLevels() {
    const categories = ['shirts', 'pants', 'dresses', 'jackets', 'shoes', 'accessories'];
    return categories.map(category => {
      const categoryProducts = state.products.filter(p => p.category === category);
      const totalStock = categoryProducts.reduce((sum, p) => sum + p.stock, 0);
      const lowStock = categoryProducts.filter(p => p.stock <= p.minStock).length;
      
      return {
        category,
        totalProducts: categoryProducts.length,
        totalStock,
        lowStockCount: lowStock,
        stockValue: categoryProducts.reduce((sum, p) => sum + (p.stock * p.cost), 0)
      };
    });
  }

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'receive-stock':
        onTabChange('stock-movement');
        break;
      case 'print-labels':
        setShowPrinter(true);
        break;
      case 'create-order':
        // Could navigate to a purchase order page in the future
        alert('Purchase order functionality coming soon!');
        break;
      case 'stock-report':
        onTabChange('inventory');
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
            className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
          >
            <Package className="h-4 w-4" />
            <span>← Back to Warehouse Dashboard</span>
          </button>
        </div>
        <BarcodePrinter />
      </div>
    );
  }

  function getRecentStockMovements() {
    // Simulate recent stock movements based on sales
    return state.sales.slice(-10).reverse().map(sale => ({
      id: sale.id,
      type: 'outbound',
      items: sale.items.map(item => ({
        product: item.product,
        quantity: item.quantity
      })),
      timestamp: sale.createdAt
    }));
  }

  function getRestockAlerts() {
    return lowStockProducts.map(product => ({
      product,
      urgency: product.stock === 0 ? 'critical' : 
               product.stock <= product.minStock * 0.5 ? 'high' : 'medium',
      suggestedOrder: Math.max(product.minStock * 2, 10)
    }));
  }

  return (
    <div className="space-y-6">
      {/* Warehouse Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-700 text-white p-8 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Warehouse Dashboard</h1>
            <p className="text-orange-100 text-lg">Foreign Fits - Global Fashion</p>
            <p className="text-orange-200 text-sm mt-1">Inventory & Stock Management</p>
          </div>
          <div className="text-right">
            <div className="p-3 bg-orange-500 rounded-full">
              <Package className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Warehouse Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900">{state.products.length}</p>
              <p className="text-xs text-blue-600 mt-1">{wellStockedProducts.length} well-stocked</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-3xl font-bold text-green-600">₹{totalStockValue.toFixed(0)}</p>
              <p className="text-xs text-green-600 mt-1">Total inventory value</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-amber-600">{lowStockProducts.length}</p>
              <p className="text-xs text-amber-600 mt-1">Need restocking</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600">{outOfStockProducts.length}</p>
              <p className="text-xs text-red-600 mt-1">Urgent restock needed</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Stock Levels */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
            Stock by Category
          </h3>
          <div className="space-y-4">
            {categoryStockLevels.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 capitalize">{category.category}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{category.totalStock} units</span>
                    {category.lowStockCount > 0 && (
                      <span className="text-xs text-red-600 block">{category.lowStockCount} low stock</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        category.lowStockCount > 0 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((category.totalStock / 100) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">${category.stockValue.toFixed(0)}</span>
                  <span className="text-xs text-gray-500">₹{category.stockValue.toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Restock Alerts */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
            Restock Alerts
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {restockAlerts.length === 0 ? (
              <div className="text-center py-4">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-600 text-sm font-medium">All products well-stocked!</p>
              </div>
            ) : (
              restockAlerts.map((alert) => (
                <div key={alert.product.id} className={`p-3 rounded-lg border-l-4 ${
                  alert.urgency === 'critical' ? 'bg-red-50 border-red-500' :
                  alert.urgency === 'high' ? 'bg-orange-50 border-orange-500' :
                  'bg-yellow-50 border-yellow-500'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{alert.product.name}</p>
                      <p className="text-xs text-gray-600">{alert.product.size} - {alert.product.color}</p>
                      <p className="text-xs text-gray-500">SKU: {alert.product.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        alert.urgency === 'critical' ? 'bg-red-100 text-red-800' :
                        alert.urgency === 'high' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {alert.urgency}
                      </span>
                      <p className="text-xs text-gray-600 mt-1">Stock: {alert.product.stock}</p>
                      <p className="text-xs text-blue-600">Order: {alert.suggestedOrder}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Stock Movements */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 text-purple-500 mr-2" />
            Recent Movements
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentStockMovements.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent stock movements.</p>
            ) : (
              recentStockMovements.map((movement) => (
                <div key={movement.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="p-1 bg-red-100 rounded-full mr-2">
                        <TrendingDown className="h-3 w-3 text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Sale #{movement.id.slice(0, 6)}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(movement.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {movement.items.slice(0, 2).map((item, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="text-gray-600 truncate">{item.product.name}</span>
                        <span className="text-red-600 font-medium">-{item.quantity}</span>
                      </div>
                    ))}
                    {movement.items.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{movement.items.length - 2} more items
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Warehouse Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('receive-stock')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-center"
          >
            <Package className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-blue-900">Receive Stock</span>
          </button>
          <button 
            onClick={() => handleQuickAction('print-labels')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-center"
          >
            <Printer className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-green-900">Print Labels</span>
          </button>
          <button 
            onClick={() => handleQuickAction('create-order')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-center"
          >
            <Truck className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-orange-900">Create Order</span>
          </button>
          <button 
            onClick={() => handleQuickAction('stock-report')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-center"
          >
            <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <span className="text-sm font-medium text-purple-900">Stock Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}