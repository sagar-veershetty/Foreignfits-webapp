import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { BarcodeGenerator } from '../Barcode/BarcodeGenerator';
import { BarcodeInput } from '../Barcode/BarcodeInput';
import { EditProduct } from '../Products/EditProduct';
import { ImageCarousel } from '../Products/ImageCarousel';
import { Search, Edit, Trash2, AlertTriangle, Package, Printer, Image as ImageIcon } from 'lucide-react';
import { BarcodePrinter } from '../Barcode/BarcodePrinter';

export function InventoryList() {
  const { state, deleteProduct } = useApp();
  const { state: authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [showBarcodes, setShowBarcodes] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showPrinter, setShowPrinter] = useState(false);

  const filteredProducts = state.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.color.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.barcode && product.barcode.includes(searchTerm));
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesLocation = locationFilter === 'all' || product.locationId === locationFilter;
    return matchesSearch && matchesCategory && matchesLocation;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'shirts', label: 'Shirts' },
    { value: 'pants', label: 'Pants' },
    { value: 'dresses', label: 'Dresses' },
    { value: 'jackets', label: 'Jackets' },
    { value: 'shoes', label: 'Shoes' },
    { value: 'accessories', label: 'Accessories' },
  ];

  const handleDelete = async (productId: string) => {
    if (authState.user?.role === 'admin' && window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(productId);
        alert('Product deleted successfully!');
      } catch (error) {
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  const canEdit = () => {
    return authState.user?.role === 'admin' || authState.user?.role === 'warehouse';
  };

  const canDelete = () => {
    return authState.user?.role === 'admin';
  };

  const canPrintBarcodes = () => {
    return authState.user?.role === 'admin' || authState.user?.role === 'warehouse';
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

  const handleBarcodeSearch = (barcode: string) => {
    setSearchTerm(barcode);
  };

  if (showPrinter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowPrinter(false)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <Package className="h-4 w-4" />
            <span>← Back to Inventory</span>
          </button>
        </div>
        <BarcodePrinter />
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <BarcodeInput
              value={searchTerm}
              onChange={setSearchTerm}
              onScan={handleBarcodeSearch}
              placeholder="Search products by name, SKU, or barcode..."
            />
          </div>
          
          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Locations</option>
              {state.locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </option>
              ))}
            </select>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-2">
              <button
                onClick={() => setShowBarcodes(!showBarcodes)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
                  showBarcodes 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>Barcodes</span>
              </button>
              {canPrintBarcodes() && (
                <button
                  onClick={() => setShowPrinter(true)}
                  className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <Printer className="h-4 w-4" />
                  <span className="hidden xs:inline">Print Labels</span>
                  <span className="xs:hidden">Print</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-shadow overflow-hidden flex flex-col">
            {/* Product Image */}
            <div className="h-48 w-full flex-shrink-0">
            {product.imageUrls && product.imageUrls.length > 0 ? (
              <ImageCarousel
                images={product.imageUrls}
                productName={product.name}
                className=""
                showControls={true}
              />
            ) : (
              <div className="h-48 w-full bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No images</p>
                </div>
              </div>
            )}
            </div>

            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                      {product.category}
                    </span>
                    <span className="text-xs text-gray-500">{product.sku}</span>
                    {product.barcode && (
                      <span className="text-xs text-blue-600 font-mono">{product.barcode}</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-1 ml-2">
                  {canEdit() && (
                    <button
                      onClick={() => setEditingProduct(product)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={authState.user?.role === 'warehouse' ? 'Edit description & minimum stock' : 'Edit product'}
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  {canDelete() && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete product (Admin only)"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-2 mb-4 flex-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">{product.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Color:</span>
                  <span className="font-medium">{product.color}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{product.location.name} ({product.location.type})</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-green-600">₹{product.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Wholesale ({product.wholesaleMinQuantity}+):</span>
                  <span className="font-bold text-blue-600">₹{product.wholesalePrice.toFixed(2)}</span>
                </div>
              </div>
              
              {showBarcodes && product.barcode && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <BarcodeGenerator value={product.barcode} height={40} width={1} />
                </div>
              )}
              
              <div className={`flex items-center justify-between p-3 rounded-lg ${
                product.stock <= product.minStock ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {product.stock <= product.minStock && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">Stock:</span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${
                    product.stock <= product.minStock ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {product.stock}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">/ {product.minStock} min</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <EditProduct
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
}