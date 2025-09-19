import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Product } from '../../types';
import { BarcodeGenerator } from '../Barcode/BarcodeGenerator';
import { BarcodeInput } from '../Barcode/BarcodeInput';
import { generateBarcode } from '../../utils/barcodeUtils';
import { MultiImageUpload } from './MultiImageUpload';
import { Save, X, Edit } from 'lucide-react';

interface EditProductProps {
  product: Product;
  onClose: () => void;
}

export function EditProduct({ product, onClose }: EditProductProps) {
  const { state, updateProduct } = useApp();
  const { state: authState } = useAuth();
  const [formData, setFormData] = useState({
    name: product.name,
    category: product.category,
    size: product.size,
    color: product.color,
    price: product.price.toString(),
    cost: product.cost.toString(),
    wholesalePrice: product.wholesalePrice.toString(),
    wholesaleMinQuantity: product.wholesaleMinQuantity.toString(),
    minStock: product.minStock.toString(),
    sku: product.sku,
    description: product.description || '',
    barcode: product.barcode || '',
    imageUrls: product.imageUrls || [],
  });

  const isAdmin = authState.user?.role === 'admin';
  const isWarehouse = authState.user?.role === 'warehouse';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedProduct: Product = {
      ...product,
      name: formData.name,
      category: formData.category,
      size: formData.size,
      color: formData.color,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      wholesalePrice: parseFloat(formData.wholesalePrice),
      wholesaleMinQuantity: parseInt(formData.wholesaleMinQuantity),
      minStock: parseInt(formData.minStock),
      sku: formData.sku,
      description: formData.description,
      barcode: formData.barcode,
      imageUrls: formData.imageUrls,
      updatedAt: new Date(),
    };

    try {
      await updateProduct(updatedProduct);
      onClose();
      alert('Product updated successfully!');
    } catch (error) {
      alert('Failed to update product. Please try again.');
    }
  };

  const handleGenerateBarcode = () => {
    const barcode = generateBarcode(product.id, formData.category);
    setFormData({ ...formData, barcode });
  };

  const handleImagesChange = (images: string[]) => {
    setFormData({ ...formData, imageUrls: images });
  };

  // Warehouse managers can only edit: stock levels (handled separately), description, and minimum stock
  const canEditField = (field: string) => {
    if (isAdmin) return true;
    if (isWarehouse) {
      return ['description', 'minStock'].includes(field);
    }
    return false;
  };

  const canEditPricing = () => isAdmin;
  const canEditProductDetails = () => isAdmin;
  const canEditBarcode = () => isAdmin;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Edit className="h-6 w-6 mr-2 text-blue-600" />
                Edit Product
              </h2>
              <p className="text-gray-600 mt-1">
                {isAdmin ? 'Full editing access' : 'Limited editing access (description & minimum stock only)'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                disabled={!canEditProductDetails()}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditProductDetails() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="Enter product name"
              />
              {!canEditProductDetails() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                disabled={!canEditProductDetails()}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditProductDetails() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              >
                <option value="shirts">Shirts</option>
                <option value="pants">Pants</option>
                <option value="dresses">Dresses</option>
                <option value="jackets">Jackets</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
              {!canEditProductDetails() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size *
              </label>
              <input
                type="text"
                required
                disabled={!canEditProductDetails()}
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditProductDetails() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="e.g., M, 32, One Size"
              />
              {!canEditProductDetails() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color *
              </label>
              <input
                type="text"
                required
                disabled={!canEditProductDetails()}
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditProductDetails() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="Enter color"
              />
              {!canEditProductDetails() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Sale Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                disabled={!canEditPricing()}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditPricing() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="0.00"
              />
              {!canEditPricing() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Cost Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                disabled={!canEditPricing()}
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditPricing() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="0.00"
              />
              {!canEditPricing() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Wholesale Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wholesale Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                disabled={!canEditPricing()}
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditPricing() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="0.00"
              />
              {!canEditPricing() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>

            {/* Wholesale Min Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wholesale Min Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                disabled={!canEditPricing()}
                value={formData.wholesaleMinQuantity}
                onChange={(e) => setFormData({ ...formData, wholesaleMinQuantity: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !canEditPricing() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                placeholder="100"
              />
              {!canEditPricing() && (
                <p className="text-xs text-gray-500 mt-1">Admin access required</p>
              )}
            </div>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU *
            </label>
            <input
              type="text"
              required
              disabled={!canEditProductDetails()}
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !canEditProductDetails() ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
              }`}
              placeholder="Enter unique SKU"
            />
            {!canEditProductDetails() && (
              <p className="text-xs text-gray-500 mt-1">Admin access required</p>
            )}
          </div>

          {/* Minimum Stock Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Stock Level *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-green-600 mt-1">✓ You can edit this field</p>
          </div>

          {/* Barcode */}
          {canEditBarcode() && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Barcode
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <BarcodeInput
                    value={formData.barcode}
                    onChange={(value) => setFormData({ ...formData, barcode: value })}
                    placeholder="Enter or scan barcode"
                    className="flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateBarcode}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Generate
                  </button>
                </div>
                {formData.barcode && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <BarcodeGenerator value={formData.barcode} height={60} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Image */}
          {canEditProductDetails() && (
            <div>
              <MultiImageUpload
                images={formData.imageUrls}
                onChange={handleImagesChange}
                maxImages={5}
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter product description"
            />
            <p className="text-xs text-green-600 mt-1">✓ You can edit this field</p>
          </div>

          {/* Current Stock Display */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-blue-900">Current Stock Level</p>
                <p className="text-2xl font-bold text-blue-600">{product.stock} units</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600">Use Stock Movement to adjust quantities</p>
                <p className="text-xs text-gray-500">Stock changes are tracked separately</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}