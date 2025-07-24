import React from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck, 
  Calendar,
  MapPin
} from 'lucide-react';

export function CustomerOrders() {
  const { state } = useCustomer();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'processing': return <Package className="h-4 w-4 text-purple-600" />;
      case 'shipped': return <Truck className="h-4 w-4 text-orange-600" />;
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled': return <Clock className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'shipped': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (state.orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders yet</h2>
        <p className="text-gray-600 mb-6">Your order history will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Orders Header */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Package className="h-6 w-6 mr-2 text-purple-600" />
          My Orders ({state.orders.length})
        </h2>
        <p className="text-gray-600 mt-1">Track your order history and status</p>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {state.orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4">
              <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(order.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {order.orderDate.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-purple-600">₹{order.total.toFixed(2)}</p>
                <p className="text-sm text-gray-600">{order.items.length} items</p>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-gray-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {order.items.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      <p className="text-sm font-medium text-purple-600">₹{item.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="flex items-center justify-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">+{order.items.length - 3} more items</p>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Shipping Address</p>
                  <p className="text-sm text-gray-600">
                    {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Info */}
            {order.trackingNumber && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                    <p className="text-sm font-mono text-purple-600">{order.trackingNumber}</p>
                  </div>
                  {order.estimatedDelivery && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">{order.estimatedDelivery.toLocaleDateString()}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}