import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Location, StockTransfer } from '../../types';
import { BarcodeInput } from '../Barcode/BarcodeInput';
import { generateId } from '../../utils/mockData';
import { Search, ArrowRight, Package, MapPin, Truck, Save, X, AlertCircle } from 'lucide-react';

export function StockTransferForm() {
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fromLocationId, setFromLocationId] = useState('');
  const [toLocationId, setToLocationId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const isAdmin = authState.user?.role === 'admin';
  const isWarehouse = authState.user?.role === 'warehouse';
  const canTransfer = isAdmin || isWarehouse;

  if (!canTransfer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center">
          <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Only Admin and Warehouse managers can transfer stock between locations.</p>
        </div>
      </div>
    );
  }

  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const availableFromLocations = selectedProduct 
    ? state.locations.filter(loc => loc.id === selectedProduct.locationId)
    : state.locations;

  const availableToLocations = fromLocationId 
    ? state.locations.filter(loc => loc.id !== fromLocationId)
    : state.locations;

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFromLocationId(product.locationId);
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
    if (!selectedProduct || !fromLocationId || !toLocationId || !quantity || !reason) return;

    const transfer: StockTransfer = {
      id: generateId(),
      productId: selectedProduct.id,
      product: selectedProduct,
      fromLocationId,
      fromLocation: state.locations.find(l => l.id === fromLocationId)!,
      toLocationId,
      toLocation: state.locations.find(l => l.id === toLocationId)!,
      quantity: parseInt(quantity),
      reason,
      reference: reference || undefined,
      status: isAdmin ? 'completed' : 'pending', // Admin can complete immediately
      requestedBy: authState.user?.name || 'Unknown User',
      requestedById: authState.user?.id || 'unknown',
      requestedAt: new Date(),
      approvedBy: isAdmin ? authState.user?.name : undefined,
      approvedById: isAdmin ? authState.user?.id : undefined,
      completedBy: isAdmin ? authState.user?.name : undefined,
      completedById: isAdmin ? authState.user?.id : undefined,
      approvedAt: isAdmin ? new Date() : undefined,
      completedAt: isAdmin ? new Date() : undefined,
      notes: notes || undefined,
    };

    dispatch({ type: 'CREATE_STOCK_TRANSFER', payload: transfer });
    
    // Reset form
    setSelectedProduct(null);
    setFromLocationId('');
    setToLocationId('');
    setQuantity('');
    setReason('');
    setReference('');
    setNotes('');
    
    alert(isAdmin 
      ? 'Stock transfer completed successfully!' 
      : 'Stock transfer request submitted for approval!'
    );
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setSearchTerm('');
    setFromLocationId('');
    setToLocationId('');
    setQuantity('');
    setReason('');
    setReference('');
    setNotes('');
  };

  const maxQuantity = selectedProduct?.stock || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Truck className="h-6 w-6 mr-2 text-blue-600" />
            Stock Transfer
          </h2>
          <p className="text-gray-600 mt-1">Transfer inventory between warehouses and stores</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                          <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">{product.location.name}</span>
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
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-700 font-medium">{selectedProduct.location.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({selectedProduct.location.type})</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Available Stock: <span className="font-medium">{selectedProduct.stock}</span></p>
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
              {/* Transfer Locations */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Location
                  </label>
                  <select
                    required
                    value={fromLocationId}
                    onChange={(e) => setFromLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled
                  >
                    <option value="">Select location</option>
                    {availableFromLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-blue-600" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Location
                  </label>
                  <select
                    required
                    value={toLocationId}
                    onChange={(e) => setToLocationId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select destination</option>
                    {availableToLocations.map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name} ({location.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={maxQuantity}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={`Enter quantity (max: ${maxQuantity})`}
                />
                {quantity && parseInt(quantity) > maxQuantity && (
                  <p className="text-red-600 text-sm mt-1">
                    Quantity cannot exceed available stock ({maxQuantity})
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transfer Reason *
                </label>
                <select
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select reason</option>
                  <option value="Store Restocking">Store Restocking</option>
                  <option value="Warehouse Consolidation">Warehouse Consolidation</option>
                  <option value="Seasonal Distribution">Seasonal Distribution</option>
                  <option value="Customer Request">Customer Request</option>
                  <option value="Inventory Balancing">Inventory Balancing</option>
                  <option value="Store Opening">Store Opening</option>
                  <option value="Promotional Campaign">Promotional Campaign</option>
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
                  placeholder="Transfer order number, request ID, etc."
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this transfer..."
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={!quantity || parseInt(quantity) > maxQuantity}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{isAdmin ? 'Complete Transfer' : 'Request Transfer'}</span>
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