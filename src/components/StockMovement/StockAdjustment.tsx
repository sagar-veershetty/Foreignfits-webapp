import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, StockAdjustment } from '../../types';
import { BarcodeInput } from '../Barcode/BarcodeInput';
import { Search, Plus, Minus, RotateCcw, Save, X } from 'lucide-react';

export function StockAdjustmentForm() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentType, setAdjustmentType] = useState<'increase' | 'decrease' | 'set'>('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [locationFilter, setLocationFilter] = useState('');

  const filteredProducts = state.products.filter(product =>
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))) &&
    (locationFilter === '' || product.locationId === locationFilter)
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
  };

  const handleBarcodeSearch = (barcode: string) => {
    setSearchTerm(barcode);
    const product = state.products.find(p => p.barcode === barcode);
    if (product) {
      handleProductSelect(product);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !quantity || !reason) return;

    const adjustment: StockAdjustment = {
      productId: selectedProduct.id,
      adjustmentType,
      quantity: parseInt(quantity),
      reason,
      reference: reference || undefined,
    };

    dispatch({ type: 'ADJUST_STOCK', payload: adjustment });
    
    // Reset form
    setSelectedProduct(null);
    setQuantity('');
    setReason('');
    setReference('');
    setAdjustmentType('increase');
    
    alert('Stock adjustment completed successfully!');
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setQuantity('');
    setReason('');
    setReference('');
    setLocationFilter('');
    setAdjustmentType('increase');
  };

  const getAdjustmentIcon = () => {
    switch (adjustmentType) {
      case 'increase': return <Plus className="h-4 w-4" />;
      case 'decrease': return <Minus className="h-4 w-4" />;
      case 'set': return <RotateCcw className="h-4 w-4" />;
    }
  };

  const getAdjustmentColor = () => {
    switch (adjustmentType) {
      case 'increase': return 'text-green-600 bg-green-50 border-green-200';
      case 'decrease': return 'text-red-600 bg-red-50 border-red-200';
      case 'set': return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const calculateNewStock = () => {
    if (!selectedProduct || !quantity) return selectedProduct?.stock || 0;
    
    const qty = parseInt(quantity);
    switch (adjustmentType) {
      case 'increase': return selectedProduct.stock + qty;
      case 'decrease': return Math.max(0, selectedProduct.stock - qty);
      case 'set': return Math.max(0, qty);
      default: return selectedProduct.stock;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Stock Adjustment</h2>
          <p className="text-gray-600 mt-1">Adjust inventory levels for products</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Location (Optional)
            </label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Locations</option>
              {state.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type}) - {location.city}, {location.state}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Filter products by warehouse or store location
            </p>
          </div>

          {/* Product Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Product
            </label>
            <BarcodeInput
              value={searchTerm}
              onChange={setSearchTerm}
              onScan={handleBarcodeSearch}
              placeholder="Search by name, SKU, or scan barcode..."
              className="w-full"
            />
            
            {searchTerm && !selectedProduct && (
              <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.sku} - {product.size} - {product.color}</p>
                        <div className="flex items-center mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {product.location.name} ({product.location.type})
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">Stock: {product.stock}</p>
                        <p className="text-xs text-gray-500">${product.price}</p>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <p className="p-3 text-gray-500 text-center">No products found</p>
                )}
              </div>
            )}
          </div>

          {/* Selected Product */}
          {selectedProduct && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{selectedProduct.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProduct.sku} - {selectedProduct.size} - {selectedProduct.color}</p>
                  <div className="flex items-center mt-1 mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {selectedProduct.location.name} ({selectedProduct.location.type})
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Current Stock: <span className="font-medium">{selectedProduct.stock}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {selectedProduct && (
            <>
              {/* Adjustment Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'increase', label: 'Increase Stock', icon: Plus },
                    { value: 'decrease', label: 'Decrease Stock', icon: Minus },
                    { value: 'set', label: 'Set Stock Level', icon: RotateCcw },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAdjustmentType(value as any)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        adjustmentType === value
                          ? value === 'increase' ? 'border-green-500 bg-green-50 text-green-700' :
                            value === 'decrease' ? 'border-red-500 bg-red-50 text-red-700' :
                            'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {adjustmentType === 'set' ? 'New Stock Level' : 'Quantity'}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={adjustmentType === 'set' ? 'Enter new stock level' : 'Enter quantity'}
                />
                {quantity && (
                  <div className={`mt-2 p-3 rounded-lg border ${getAdjustmentColor()}`}>
                    <div className="flex items-center space-x-2">
                      {getAdjustmentIcon()}
                      <span className="font-medium">
                        New Stock Level: {calculateNewStock()}
                        {adjustmentType !== 'set' && (
                          <span className="ml-2">
                            ({adjustmentType === 'increase' ? '+' : '-'}{quantity})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason *
                </label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select reason</option>
                  <option value="Stock Count Correction">Stock Count Correction</option>
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Lost/Stolen">Lost/Stolen</option>
                  <option value="Return to Supplier">Return to Supplier</option>
                  <option value="New Stock Received">New Stock Received</option>
                  <option value="Transfer In">Transfer In</option>
                  <option value="Transfer Out">Transfer Out</option>
                  <option value="Promotional Giveaway">Promotional Giveaway</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Reference */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference (Optional)
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="PO number, transfer ID, etc."
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Apply Adjustment</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}