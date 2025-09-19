import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { generateBarcode } from '../../utils/barcodeUtils';
import { BarcodeGenerator } from '../Barcode/BarcodeGenerator';
import { BarcodeInput } from '../Barcode/BarcodeInput';
import { MultiImageUpload } from './MultiImageUpload';
import { Save, X } from 'lucide-react';

export function AddProduct() {
  const { state, createProduct } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    category: 'shirts' as Product['category'],
    size: '',
    color: '',
    price: '',
    cost: '',
    wholesalePrice: '',
    wholesaleMinQuantity: '100',
    stock: '',
    minStock: '',
    sku: '',
    description: '',
    barcode: '',
    imageUrls: [],
    locationId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedLocation = state.locations.find(loc => loc.id === formData.locationId);
    if (!selectedLocation) {
      alert('Please select a location for the product');
      return;
    }
    
    const product = {
      name: formData.name,
      category: formData.category,
      size: formData.size,
      color: formData.color,
      price: parseFloat(formData.price),
      cost: parseFloat(formData.cost),
      wholesalePrice: parseFloat(formData.wholesalePrice),
      wholesaleMinQuantity: parseInt(formData.wholesaleMinQuantity),
      stock: parseInt(formData.stock),
      minStock: parseInt(formData.minStock),
      sku: formData.sku,
      description: formData.description,
      barcode: formData.barcode || generateBarcode(Date.now().toString(), formData.category),
      imageUrls: formData.imageUrls,
      locationId: formData.locationId,
      location: selectedLocation,
    };

    try {
      await createProduct(product);
      
      // Reset form
      setFormData({
        name: '',
        category: 'shirts',
        size: '',
        color: '',
        price: '',
        cost: '',
        wholesalePrice: '',
        wholesaleMinQuantity: '100',
        stock: '',
        minStock: '',
        sku: '',
        description: '',
        barcode: '',
        imageUrls: [],
        locationId: '',
      });

      alert('Product added successfully!');
    } catch (error) {
      alert('Failed to add product. Please try again.');
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      category: 'shirts',
      size: '',
      color: '',
      price: '',
      cost: '',
      wholesalePrice: '',
      wholesaleMinQuantity: '100',
      stock: '',
      minStock: '',
      sku: '',
      description: '',
      barcode: '',
      imageUrls: [],
      locationId: '',
    });
  };

  const handleGenerateBarcode = () => {
    const tempId = Date.now().toString();
    const barcode = generateBarcode(tempId, formData.category);
    setFormData({ ...formData, barcode });
  };

  const handleImagesChange = (images: string[]) => {
    setFormData({ ...formData, imageUrls: images });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Product</h2>
          <p className="text-gray-600 mt-1">Foreign Fits - Global Fashion Collection</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="shirts">Shirts</option>
                <option value="pants">Pants</option>
                <option value="dresses">Dresses</option>
                <option value="jackets">Jackets</option>
                <option value="shoes">Shoes</option>
                <option value="accessories">Accessories</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size *
              </label>
              <input
                type="text"
                required
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., M, 32, One Size"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color *
              </label>
              <input
                type="text"
                required
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter color"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sale Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wholesale Price *
              </label>
              <input
                type="number"
                required
                step="0.01"
                min="0"
                value={formData.wholesalePrice}
                onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wholesale Min Quantity
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.wholesaleMinQuantity}
                onChange={(e) => setFormData({ ...formData, wholesaleMinQuantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Stock *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>

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
            </div>
          </div>

          {/* Location Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location (Warehouse/Store) *
            </label>
            <select
              required
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select location</option>
              {state.locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name} ({location.type}) - {location.city}, {location.state}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the warehouse or store where this product will be stored
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU *
            </label>
            <input
              type="text"
              required
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter unique SKU"
            />
          </div>

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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <select
                required
                value={formData.locationId}
                onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select location</option>
                {state.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name} ({location.type}) - {location.city}
                  </option>
                ))}
              </select>
            </div>

                  <BarcodeGenerator value={formData.barcode} height={60} />
                </div>
              )}
            </div>
          </div>

          <div>
            <MultiImageUpload
              images={formData.imageUrls}
              onChange={handleImagesChange}
              maxImages={5}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter product description (optional)"
            />
          </div>

          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Add Product</span>
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
        </form>
      </div>
    </div>
  );
}