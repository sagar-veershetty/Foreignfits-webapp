import React from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { ImageCarousel } from '../Products/ImageCarousel';
import { 
  Heart, 
  ShoppingCart, 
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

export function Wishlist() {
  const { state, removeFromWishlist, addToCart } = useCustomer();

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
  };

  const handleRemoveFromWishlist = (productId: string) => {
    removeFromWishlist(productId);
  };

  if (state.wishlist.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center">
        <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-600 mb-6">Save items you love for later!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wishlist Header */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Heart className="h-6 w-6 mr-2 text-red-500 fill-current" />
          My Wishlist ({state.wishlist.length} items)
        </h2>
        <p className="text-gray-600 mt-1">Items you've saved for later</p>
      </div>

      {/* Wishlist Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {state.wishlist.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden">
            {/* Product Image */}
            <div className="relative h-48 w-full">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <ImageCarousel
                  images={product.imageUrls}
                  productName={product.name}
                  className=""
                  showControls={product.imageUrls.length > 1}
                />
              ) : (
                <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-400" />
                </div>
              )}
              
              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFromWishlist(product.id)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-lg font-bold text-purple-600">₹{product.price.toFixed(2)}</span>
                  <div className="text-xs text-gray-500">{product.size} - {product.color}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAddToCart(product)}
                disabled={product.stock === 0}
                className={`w-full py-2 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                  product.stock > 0
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart className="h-4 w-4" />
                <span>{product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}