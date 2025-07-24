import React from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { ImageCarousel } from '../Products/ImageCarousel';
import { 
  ShoppingCart as CartIcon, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowRight,
  Image as ImageIcon
} from 'lucide-react';

interface ShoppingCartProps {
  onCheckout?: () => void;
}

export function ShoppingCart({ onCheckout }: ShoppingCartProps) {
  const { state, updateCartQuantity, removeFromCart, clearCart } = useCustomer();

  const subtotal = state.cart.reduce((sum, item) => sum + item.total, 0);
  const tax = subtotal * 0.18; // 18% GST for India
  const shipping = subtotal > 8000 ? 0 : 799; // Free shipping over ₹8000
  const total = subtotal + tax + shipping;

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateCartQuantity(productId, newQuantity);
    }
  };

  if (state.cart.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <CartIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-600 mb-6">Add some products to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <CartIcon className="h-6 w-6 mr-2 text-purple-600" />
            Shopping Cart ({state.cart.length} items)
          </h2>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Clear Cart
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {state.cart.map((item) => (
            <div key={item.productId} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Product Image */}
                <div className="w-full sm:w-32 h-32 flex-shrink-0">
                  {item.product.imageUrls && item.product.imageUrls.length > 0 ? (
                    <ImageCarousel
                      images={item.product.imageUrls}
                      productName={item.product.name}
                      className=""
                      showControls={false}
                    />
                  ) : (
                    <div className="h-32 w-full bg-gray-100 flex items-center justify-center rounded-lg">
                      <ImageIcon className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">{item.product.size} - {item.product.color}</p>
                      <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="font-medium text-gray-900 w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">₹{item.price.toFixed(2)} each</p>
                      <p className="font-bold text-purple-600">₹{item.total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal ({state.cart.length} items)</span>
                <span className="font-medium">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-medium">
                  {shipping === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `₹${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-medium">₹{tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-purple-600">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {shipping > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  Add ₹{(8000 - subtotal).toFixed(2)} more for FREE shipping!
                </p>
              </div>
            )}

            <button
              onClick={onCheckout}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Secure checkout powered by SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}