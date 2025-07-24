import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { BarcodeGenerator } from './BarcodeGenerator';
import { BarcodeInput } from './BarcodeInput';
import { Printer, Package, Search, Download, Grid3X3, Eye } from 'lucide-react';

interface BarcodePrintOptions {
  includePrice: boolean;
  includeSize: boolean;
  includeColor: boolean;
  includeSKU: boolean;
  includeCategory: boolean;
  stickerSize: 'small' | 'medium' | 'large';
}

interface ProductWithQuantity {
  product: Product;
  quantity: number;
}

export function BarcodePrinter() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<ProductWithQuantity[]>([]);
  const [printOptions, setPrintOptions] = useState<BarcodePrintOptions>({
    includePrice: true,
    includeSize: true,
    includeColor: true,
    includeSKU: true,
    includeCategory: false,
    stickerSize: 'medium',
  });

  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.barcode && product.barcode.includes(searchTerm))
  );

  const handleProductSelect = (product: Product) => {
    if (!selectedProducts.find(p => p.product.id === product.id)) {
      setSelectedProducts([...selectedProducts, { product, quantity: 1 }]);
    }
    setSearchTerm('');
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.product.id !== productId));
  };

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts(selectedProducts.map(p => 
      p.product.id === productId ? { ...p, quantity } : p
    ));
  };

  const handleBarcodeSearch = (barcode: string) => {
    setSearchTerm(barcode);
    const product = state.products.find(p => p.barcode === barcode);
    if (product) {
      handleProductSelect(product);
    }
  };

  const handleSelectAll = () => {
    setSelectedProducts(state.products.map(product => ({ product, quantity: 1 })));
  };

  const handleClearAll = () => {
    setSelectedProducts([]);
  };

  const getStickerStyles = () => {
    switch (printOptions.stickerSize) {
      case 'small': return { 
        width: '180px', 
        height: '100px', 
        barcodeHeight: 30,
        fontSize: '8px',
        titleSize: '9px'
      };
      case 'medium': return { 
        width: '240px', 
        height: '160px', 
        barcodeHeight: 40,
        fontSize: '10px',
        titleSize: '11px'
      };
      case 'large': return { 
        width: '320px', 
        height: '200px', 
        barcodeHeight: 50,
        fontSize: '12px',
        titleSize: '13px'
      };
    }
  };

  const StickerPreview = ({ product, styles }: { product: Product; styles: any }) => (
    <div
      className="border border-gray-300 bg-white inline-block m-1"
      style={{
        width: styles.width,
        height: styles.height,
        padding: '8px',
        fontSize: styles.fontSize,
        pageBreakInside: 'avoid',
      }}
    >
      {/* Product Name */}
      <div 
        className="font-bold mb-1 truncate"
        style={{ 
          fontSize: styles.titleSize,
          lineHeight: '1.2'
        }}
      >
        {product.name}
      </div>

      {/* Product Details */}
      <div className="mb-2" style={{ lineHeight: '1.3' }}>
        {printOptions.includeCategory && (
          <div className="text-gray-600 capitalize text-xs">
            {product.category}
          </div>
        )}
        {printOptions.includeSize && printOptions.includeColor && (
          <div className="text-xs">{product.size} - {product.color}</div>
        )}
        {printOptions.includeSize && !printOptions.includeColor && (
          <div className="text-xs">Size: {product.size}</div>
        )}
        {!printOptions.includeSize && printOptions.includeColor && (
          <div className="text-xs">Color: {product.color}</div>
        )}
        {printOptions.includeSKU && (
          <div className="font-mono text-xs opacity-75">
            {product.sku}
          </div>
        )}
        {printOptions.includePrice && (
          <div className="font-bold text-blue-600 text-xs">
            ₹{product.price.toFixed(2)}
          </div>
        )}
      </div>

      {/* Barcode */}
      {product.barcode && (
        <div className="text-center">
          <BarcodeGenerator 
            value={product.barcode} 
            height={styles.barcodeHeight}
            width={1.2}
            displayValue={true}
          />
        </div>
      )}
    </div>
  );

  const generatePrintHTML = () => {
    const styles = getStickerStyles();
    let stickersHTML = '';

    selectedProducts.forEach(({ product, quantity }) => {
      for (let copy = 0; copy < quantity; copy++) {
        stickersHTML += `
          <div class="sticker" style="
            width: ${printOptions.stickerSize === 'small' ? '2.25in' : printOptions.stickerSize === 'medium' ? '3in' : '4in'};
            height: ${printOptions.stickerSize === 'small' ? '1.25in' : printOptions.stickerSize === 'medium' ? '2in' : '2.5in'};
            border: 1px solid #ddd;
            padding: 8px;
            margin: 4px;
            display: inline-block;
            vertical-align: top;
            background-color: white;
            font-size: ${styles.fontSize};
            page-break-inside: avoid;
            font-family: Arial, sans-serif;
          ">
            <div style="
              font-weight: bold;
              margin-bottom: 4px;
              font-size: ${styles.titleSize};
              line-height: 1.2;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            ">${product.name}</div>
            
            <div style="margin-bottom: 6px; line-height: 1.3;">
              ${printOptions.includeCategory ? `<div style="text-transform: capitalize; color: #666; font-size: 85%;">${product.category}</div>` : ''}
              ${printOptions.includeSize && printOptions.includeColor ? `<div style="font-size: 85%;">${product.size} - ${product.color}</div>` : ''}
              ${printOptions.includeSize && !printOptions.includeColor ? `<div style="font-size: 85%;">Size: ${product.size}</div>` : ''}
              ${!printOptions.includeSize && printOptions.includeColor ? `<div style="font-size: 85%;">Color: ${product.color}</div>` : ''}
              ${printOptions.includeSKU ? `<div style="font-family: monospace; font-size: 75%; opacity: 0.8;">${product.sku}</div>` : ''}
              ${printOptions.includePrice ? `<div style="font-weight: bold; color: #2563eb; font-size: 85%;">₹${product.price.toFixed(2)}</div>` : ''}
            </div>
            
            ${product.barcode ? `
              <div style="text-align: center;">
                <div class="barcode-container">
                  <canvas id="barcode-${product.id}-${copy}" width="200" height="${getStickerStyles().barcodeHeight + 20}"></canvas>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }
    });

    return stickersHTML;
  };

  const handlePrint = () => {
    if (selectedProducts.length === 0) return;

    // Create a blob URL approach for better compatibility
    const printContent = createPrintContent();
    const blob = new Blob([printContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const printWindow = window.open(url, '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print barcode stickers.');
      return;
    }

    // Clean up the blob URL after a delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 10000);
  };

  const createPrintContent = () => {
    const styles = getStickerStyles();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Foreign Fits - Barcode Stickers</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  <style>
    @page {
      margin: 0.5in;
      size: letter;
    }
    
    * {
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background: white;
      color: black;
    }
    
    .print-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 10px;
    }
    
    .print-header h2 {
      color: #2563eb;
      margin: 0;
      font-size: 24px;
    }
    
    .print-header p {
      margin: 5px 0;
      color: #666;
      font-size: 14px;
    }
    
    .stickers-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-start;
    }
    
    .sticker {
      width: ${styles.width};
      height: ${styles.height};
      border: 1px solid #ddd;
      padding: 8px;
      background: white;
      font-size: ${styles.fontSize};
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    
    .sticker-content {
      flex: 1;
    }
    
    .product-name {
      font-weight: bold;
      margin-bottom: 4px;
      font-size: ${styles.titleSize};
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .product-details {
      margin-bottom: 6px;
      line-height: 1.3;
      font-size: 85%;
    }
    
    .product-category {
      text-transform: capitalize;
      color: #666;
      font-size: 85%;
    }
    
    .product-sku {
      font-family: monospace;
      font-size: 75%;
      opacity: 0.8;
    }
    
    .product-price {
      font-weight: bold;
      color: #2563eb;
      font-size: 85%;
    }
    
    .barcode-section {
      text-align: center;
      margin-top: auto;
    }
    
    .barcode-canvas {
      margin: 0 auto;
      display: block;
      max-width: 100%;
    }
    
    .barcode-text {
      font-family: monospace;
      font-size: 10px;
      margin-top: 2px;
    }
    
    .manual-print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2563eb;
      color: white;
      padding: 12px 20px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .manual-print-btn:hover {
      background: #1d4ed8;
    }
    
    @media print {
      .manual-print-btn {
        display: none !important;
      }
      
      body {
        background: white !important;
      }
      
      .print-header {
        margin-bottom: 15px;
      }
      
      .stickers-container {
        gap: 4px;
      }
    }
  </style>
</head>
<body>
  <button class="manual-print-btn" onclick="window.print()">🖨️ Print Stickers</button>
  
  <div class="print-header">
    <h2>Foreign Fits - Global Fashion</h2>
    <p>Barcode Stickers - ${new Date().toLocaleDateString()}</p>
    <p>Total Stickers: ${selectedProducts.reduce((sum, p) => sum + p.quantity, 0)}</p>
  </div>
  
  <div class="stickers-container">
    ${selectedProducts.map(({ product, quantity }) => 
      Array.from({ length: quantity }, (_, copy) => `
        <div class="sticker">
          <div class="sticker-content">
            <div class="product-name">${product.name}</div>
            <div class="product-details">
              ${printOptions.includeCategory ? `<div class="product-category">${product.category}</div>` : ''}
              ${printOptions.includeSize && printOptions.includeColor ? `<div>${product.size} - ${product.color}</div>` : ''}
              ${printOptions.includeSize && !printOptions.includeColor ? `<div>Size: ${product.size}</div>` : ''}
              ${!printOptions.includeSize && printOptions.includeColor ? `<div>Color: ${product.color}</div>` : ''}
              ${printOptions.includeSKU ? `<div class="product-sku">${product.sku}</div>` : ''}
              ${printOptions.includePrice ? `<div class="product-price">₹${product.price.toFixed(2)}</div>` : ''}
            </div>
          </div>
          
          ${product.barcode ? `
            <div class="barcode-section">
              <canvas id="barcode-${product.id}-${copy}" class="barcode-canvas"></canvas>
            </div>
          ` : ''}
        </div>
      `).join('')
    ).join('')}
  </div>
  
  <script>
    // Wait for JsBarcode to load and DOM to be ready
    function generateBarcodes() {
      console.log('Starting barcode generation...');
      
      if (typeof JsBarcode === 'undefined') {
        console.error('JsBarcode not loaded');
        return;
      }

      // Generate barcodes for each product
      ${selectedProducts.map(({ product, quantity }) => 
        Array.from({ length: quantity }, (_, copy) => `
          try {
            const canvas${product.id}_${copy} = document.getElementById('barcode-${product.id}-${copy}');
            if (canvas${product.id}_${copy}) {
              JsBarcode(canvas${product.id}_${copy}, "${product.barcode}", {
                format: "CODE128",
                width: 1.5,
                height: ${styles.barcodeHeight},
                displayValue: true,
                fontSize: 10,
                textMargin: 4,
                background: "#ffffff",
                lineColor: "#000000",
                margin: 0,
                textAlign: "center",
                textPosition: "bottom"
              });
              console.log('Generated barcode for ${product.name} copy ${copy + 1}');
            }
          } catch (error) {
            console.error('Error generating barcode for ${product.name}:', error);
          }
        `).join('\n')
      ).join('\n')}
      
      console.log('Barcode generation completed');
    }

    // Wait for everything to load
    window.addEventListener('load', function() {
      console.log('Window loaded, generating barcodes...');
      setTimeout(generateBarcodes, 500);
      
      // Auto-print after barcodes are generated
      setTimeout(function() {
        try {
          console.log('Attempting to print...');
          window.print();
        } catch (error) {
          console.error('Print failed:', error);
        }
      }, 1500);
    });
    // Focus the window to ensure print dialog appears
    window.focus();
  </script>
</body>
</html>`;
  };
  const totalStickers = selectedProducts.reduce((sum, p) => sum + p.quantity, 0);
  const styles = getStickerStyles();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Printer className="h-6 w-6 mr-2 text-blue-600" />
            Print Barcode Stickers
          </h2>
          <p className="text-gray-600 mt-1">Generate professional barcode stickers for your products</p>
        </div>

        {/* Product Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <BarcodeInput
            value={searchTerm}
            onChange={setSearchTerm}
            onScan={handleBarcodeSearch}
            placeholder="Search by name, SKU, or scan barcode..."
            className="w-full"
          />
          
          {searchTerm && (
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
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-green-600">₹{product.price.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">Stock: {product.stock}</p>
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

        {/* Bulk Actions */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={handleSelectAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Select All Products
          </button>
          <button
            onClick={handleClearAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Print Options */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Print Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sticker Content */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Include on Sticker</h4>
            <div className="space-y-2">
              {[
                { key: 'includePrice', label: 'Price' },
                { key: 'includeSize', label: 'Size' },
                { key: 'includeColor', label: 'Color' },
                { key: 'includeSKU', label: 'SKU' },
                { key: 'includeCategory', label: 'Category' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={printOptions[key as keyof BarcodePrintOptions] as boolean}
                    onChange={(e) => setPrintOptions({
                      ...printOptions,
                      [key]: e.target.checked
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Print Settings */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Print Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sticker Size
                </label>
                <select
                  value={printOptions.stickerSize}
                  onChange={(e) => setPrintOptions({
                    ...printOptions,
                    stickerSize: e.target.value as 'small' | 'medium' | 'large'
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="small">Small (2.25" × 1.25")</option>
                  <option value="medium">Medium (3" × 2")</option>
                  <option value="large">Large (4" × 2.5")</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Default Copies for New Products
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Set individual quantities for each product below
                </p>
                <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  Use the quantity controls on each product card to set how many stickers to print
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Products */}
      {selectedProducts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Products ({selectedProducts.length})
            </h3>
            <div className="text-sm text-gray-600">
              Total stickers: {totalStickers}
            </div>
          </div>

          {/* Sticker Preview */}
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Sticker Preview ({printOptions.stickerSize})
            </h4>
            <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 overflow-x-auto">
              <div className="flex flex-wrap">
                {selectedProducts.slice(0, 6).map(({ product }) => (
                  <StickerPreview key={product.id} product={product} styles={styles} />
                ))}
                {selectedProducts.length > 6 && (
                  <div 
                    className="border border-gray-300 bg-gray-100 inline-flex items-center justify-center m-1 text-gray-500"
                    style={{
                      width: styles.width,
                      height: styles.height,
                    }}
                  >
                    <div className="text-center">
                      <Package className="h-6 w-6 mx-auto mb-1" />
                      <div className="text-xs">+{selectedProducts.length - 6} more</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {selectedProducts.map(({ product, quantity }) => (
              <div key={product.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                    <p className="text-xs text-gray-600">{product.sku} - {product.size} - {product.color}</p>
                    <p className="text-xs text-green-600">₹{product.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(product.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sticker Quantity
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(product.id, quantity - 1)}
                      disabled={quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded text-sm font-medium"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded text-sm"
                    />
                    <button
                      onClick={() => handleQuantityChange(product.id, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handlePrint}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <Printer className="h-4 w-4" />
            <span>Print {totalStickers} Barcode Sticker{totalStickers > 1 ? 's' : ''}</span>
          </button>
        </div>
      )}

      {selectedProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-100">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Select products to print barcode stickers</p>
        </div>
      )}
    </div>
  );
}