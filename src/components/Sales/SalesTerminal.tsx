import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product, Sale, SaleItem } from '../../types';
import { BarcodeInput } from '../Barcode/BarcodeInput';
import { ReceiptPrinter } from './ReceiptPrinter';
import { Search, Plus, Minus, Trash2, ShoppingCart, Image as ImageIcon } from 'lucide-react';
import { ImageCarousel } from '../Products/ImageCarousel';
import { generateId } from '../../utils/mockData';

export function SalesTerminal() {
  const { state, dispatch } = useApp();
  const { state: authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  
  const filteredProducts = state.products.filter(product =>
    product.stock > 0 && (
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    )
  );

  const subtotal = state.currentSale.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // 18% GST rate for India
  const total = subtotal + tax;

  const addToSale = (product: Product) => {
    // Determine if wholesale pricing applies
    const quantity = 1;
    const unitPrice = quantity >= product.wholesaleMinQuantity ? product.wholesalePrice : product.price;
    
    const saleItem: SaleItem = {
      productId: product.id,
      product,
      quantity,
      price: unitPrice,
      total: unitPrice,
    };
    dispatch({ type: 'ADD_TO_SALE', payload: saleItem });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_SALE', payload: productId });
    } else {
      // Find the product to check wholesale pricing
      const product = state.products.find(p => p.id === productId);
      if (product) {
        const unitPrice = quantity >= product.wholesaleMinQuantity ? product.wholesalePrice : product.price;
        dispatch({ 
          type: 'UPDATE_SALE_QUANTITY', 
          payload: { 
            productId, 
            quantity,
            price: unitPrice
          } 
        });
      } else {
        dispatch({ type: 'UPDATE_SALE_QUANTITY', payload: { productId, quantity } });
      }
    }
  };

  const completeSale = () => {
    if (state.currentSale.length === 0) return;

    const sale: Sale = {
      id: generateId(),
      items: state.currentSale,
      subtotal,
      tax,
      total,
      paymentMethod,
      customerName: customerName || undefined,
      soldBy: authState.user?.name || 'Unknown User',
      soldById: authState.user?.id || 'unknown',
      createdAt: new Date(),
    };

    dispatch({ type: 'COMPLETE_SALE', payload: sale });
    
    // Show receipt printer
    setCompletedSale(sale);
    
    setCustomerName('');
    setSearchTerm('');
  };

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  const handleBarcodeSearch = (barcode: string) => {
    setSearchTerm(barcode);
    // Auto-add product if exact barcode match found
    const product = state.products.find(p => p.barcode === barcode && p.stock > 0);
    if (product) {
      addToSale(product);
      setSearchTerm(''); // Clear search after adding
    }
  };
  
  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="mb-4">
            <BarcodeInput
              value={searchTerm}
              onChange={setSearchTerm}
              onScan={handleBarcodeSearch}
              placeholder="Search or scan products to add to sale..."
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => addToSale(product)}
              >
                {/* Product Image */}
                {product.imageUrls && product.imageUrls.length > 0 ? (
                  <ImageCarousel
                    images={product.imageUrls}
                    productName={product.name}
                    className="h-24 mb-3"
                    showControls={product.imageUrls.length > 1}
                  />
                ) : (
                  <div className="h-24 w-full mb-3 bg-gray-100 rounded-md flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{product.name}</h4>
                  <Plus className="h-4 w-4 text-blue-600" />
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <p>{product.size} - {product.color}</p>
                  {product.barcode && (
                    <p className="font-mono text-xs text-blue-600">{product.barcode}</p>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-green-600">₹{product.price.toFixed(2)}</span>
                  <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Current Sale */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <ShoppingCart className="h-5 w-5 mr-2" />
          Current Sale
        </h3>

        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {state.currentSale.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items in current sale</p>
          ) : (
            state.currentSale.map((item) => (
              <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                  <p className="text-sm text-gray-600">{item.product.size} - {item.product.color}</p>
                  <p className="text-sm font-medium text-green-600">${item.price.toFixed(2)} each</p>
                  <p className="text-sm font-medium text-green-600">₹{item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_FROM_SALE', payload: item.productId })}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded ml-2"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {state.currentSale.length > 0 && (
          <>
            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (18% GST):</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>Total:</span>
                <span className="text-green-600">₹{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <input
                type="text"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'other')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={completeSale}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Complete Sale - Foreign Fits
              </button>
            </div>
          </>
        )}
      </div>
    </div>
    
    {/* Receipt Printer Modal */}
    {completedSale && (
      <ReceiptPrinter
        sale={completedSale}
        onClose={() => setCompletedSale(null)}
      />
    )}
    </>
  );
}