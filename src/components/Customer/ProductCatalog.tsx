import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useCustomer } from '../../context/CustomerContext';
import { Product } from '../../types';
import { ImageCarousel } from '../Products/ImageCarousel';
import { 
  Search, 
  Filter, 
  Heart, 
  ShoppingCart, 
  Star, 
  Grid3X3, 
  List,
  SlidersHorizontal,
  Image as ImageIcon,
  Package
} from 'lucide-react';

export function ProductCatalog() {
  const { state: appState } = useApp();
  const { state: customerState, addToCart, addToWishlist, removeFromWishlist } = useCustomer();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState<'name' | 'price-low' | 'price-high' | 'newest'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = appState.products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;
      const inStock = product.stock > 0;
      
      return matchesSearch && matchesCategory && matchesPrice && inStock;
    });

    // Sort products
    switch (sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    return filtered;
  }, [appState.products, searchTerm, categoryFilter, priceRange, sortBy]);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'pants', label: 'Pants' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'jackets', label: 'Jackets' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' },
  ];

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleWishlistToggle = (product: Product) => {
    const isInWishlist = customerState.wishlist.some(item => item.id === product.id);
    if (isInWishlist) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const isInWishlist = (productId: string) => {
    return customerState.wishlist.some(item => item.id === productId);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      shirts: 'bg-blue-100 text-blue-800',
      pants: 'bg-indigo-100 text-indigo-800',
      dresses: 'bg-pink-100 text-pink-800',
      jackets: 'bg-gray-100 text-gray-800',
      shoes: 'bg-emerald-100 text-emerald-800',
      accessories: 'bg-purple-100 text-purple-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  showFilters ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>Filters</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range: ${priceRange.min} - ${priceRange.max}
                  </label>
                  <div className="flex space-x-4">
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({ ...priceRange, min: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="500"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing {filteredProducts.length} of {appState.products.filter(p => p.stock > 0).length} products
        </p>
        <div className="text-sm text-gray-500">
          Cart: {customerState.cart.length} items | Wishlist: {customerState.wishlist.length} items
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden group">
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
                
                {/* Wishlist Button */}
                <button
                  onClick={() => handleWishlistToggle(product)}
                  className={`absolute top-2 right-2 p-2 rounded-full transition-colors ${
                    isInWishlist(product.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
              </div>

              <div className="p-4">
                <div className="mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                    {product.category}
                  </span>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-lg font-bold text-purple-600">₹{product.price.toFixed(2)}</span>
                    <div className="text-xs text-gray-500">{product.size} - {product.color}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-yellow-400 text-sm">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="ml-1 text-gray-600">4.5</span>
                    </div>
                    <div className="text-xs text-gray-500">{product.stock} in stock</div>
                  </div>
                </div>

                <button
                  onClick={() => handleAddToCart(product)}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="w-full md:w-48 h-48 flex-shrink-0">
                  {product.imageUrls && product.imageUrls.length > 0 ? (
                    <ImageCarousel
                      images={product.imageUrls}
                      productName={product.name}
                      className=""
                      showControls={product.imageUrls.length > 1}
                    />
                  ) : (
                    <div className="h-48 w-full bg-gray-100 flex items-center justify-center rounded-lg">
                      <ImageIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                        {product.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleWishlistToggle(product)}
                      className={`p-2 rounded-full transition-colors ${
                        isInWishlist(product.id)
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-gray-600 mb-3">{product.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-purple-600">₹{product.price.toFixed(2)}</span>
                      <div className="text-sm text-gray-500">{product.size} - {product.color}</div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-yellow-400 mb-1">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-gray-600">4.5 (24 reviews)</span>
                      </div>
                      <div className="text-sm text-gray-500">{product.stock} in stock</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}