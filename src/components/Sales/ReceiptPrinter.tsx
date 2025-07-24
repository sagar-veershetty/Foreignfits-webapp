import React from 'react';
import { Sale } from '../../types';
import { Printer, X } from 'lucide-react';

interface ReceiptPrinterProps {
  sale: Sale;
  onClose: () => void;
}

export function ReceiptPrinter({ sale, onClose }: ReceiptPrinterProps) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = generateReceiptHTML(sale);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Foreign Fits - Receipt #${sale.id.slice(0, 8)}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 5mm;
            }
            
            @media print {
              body { 
                margin: 0; 
                padding: 0;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                line-height: 1.4;
              }
              .no-print { display: none !important; }
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              max-width: 300px;
              margin: 0 auto;
              padding: 10px;
              background: white;
            }
            
            .receipt-header {
              text-align: center;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            
            .store-name {
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            
            .store-tagline {
              font-size: 12px;
              margin-bottom: 5px;
            }
            
            .receipt-info {
              margin-bottom: 15px;
              font-size: 11px;
            }
            
            .receipt-info div {
              margin-bottom: 2px;
            }
            
            .items-section {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 10px 0;
              margin: 15px 0;
            }
            
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
              font-size: 11px;
            }
            
            .item-name {
              flex: 1;
              margin-right: 10px;
            }
            
            .item-details {
              font-size: 10px;
              color: #666;
              margin-left: 10px;
              margin-bottom: 3px;
            }
            
            .item-price {
              white-space: nowrap;
            }
            
            .totals-section {
              margin: 15px 0;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 12px;
            }
            
            .total-row.final {
              font-weight: bold;
              font-size: 14px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 10px;
            }
            
            .payment-info {
              text-align: center;
              margin: 15px 0;
              padding: 10px 0;
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 10px;
            }
            
            .thank-you {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            
            .return-policy {
              margin-top: 15px;
              font-size: 9px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          ${receiptHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const generateReceiptHTML = (sale: Sale) => {
    return `
      <div class="receipt">
        <!-- Header -->
        <div class="receipt-header">
          <div class="store-name">FOREIGN FITS</div>
          <div class="store-tagline">Global Fashion Collection</div>
          <div style="font-size: 10px; margin-top: 5px;">
            123 Fashion Street, Style City<br>
            Phone: (555) 123-4567<br>
            www.foreignfits.com
          </div>
        </div>

        <!-- Receipt Info -->
        <div class="receipt-info">
          <div><strong>Receipt #:</strong> ${sale.id.slice(0, 8).toUpperCase()}</div>
          <div><strong>Date:</strong> ${new Date(sale.createdAt).toLocaleDateString()}</div>
          <div><strong>Time:</strong> ${new Date(sale.createdAt).toLocaleTimeString()}</div>
          <div><strong>Customer:</strong> ${sale.customerName || 'Walk-in Customer'}</div>
          <div><strong>Cashier:</strong> Sales Associate</div>
        </div>

        <!-- Items -->
        <div class="items-section">
          <div style="font-weight: bold; margin-bottom: 10px; text-align: center;">ITEMS PURCHASED</div>
          ${sale.items.map(item => `
            <div class="item-row">
              <div class="item-name">
                <div>${item.product.name}</div>
                <div class="item-details">${item.product.size} - ${item.product.color}</div>
                <div class="item-details">SKU: ${item.product.sku}</div>
              </div>
              <div class="item-price">
                <div>₹${item.quantity} x ₹${item.price.toFixed(2)}</div>
                <div style="font-weight: bold;">₹${item.total.toFixed(2)}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${sale.subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span>Tax (18% GST):</span>
            <span>₹${sale.tax.toFixed(2)}</span>
          </div>
          <div class="total-row final">
            <span>TOTAL:</span>
            <span>₹${sale.total.toFixed(2)}</span>
          </div>
        </div>

        <!-- Payment Info -->
        <div class="payment-info">
          <div style="font-weight: bold; margin-bottom: 5px;">PAYMENT METHOD</div>
          <div style="text-transform: uppercase; font-size: 14px;">${sale.paymentMethod}</div>
          <div style="margin-top: 5px;">Amount Paid: ₹${sale.total.toFixed(2)}</div>
          <div>Change: ₹0.00</div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="thank-you">THANK YOU FOR SHOPPING!</div>
          <div>Visit us again for the latest fashion trends</div>
          <div style="margin-top: 10px;">Follow us on social media</div>
          <div>@ForeignFits | #GlobalFashion</div>
          
          <div class="return-policy">
            <div style="font-weight: bold; margin-bottom: 5px;">RETURN POLICY</div>
            <div>Returns accepted within 30 days with receipt</div>
            <div>Items must be in original condition</div>
            <div>Sale items are final sale</div>
          </div>
          
          <div style="margin-top: 15px; border-top: 1px dashed #000; padding-top: 10px;">
            <div>Receipt generated on ${new Date().toLocaleString()}</div>
            <div>Thank you for choosing Foreign Fits!</div>
          </div>
        </div>
      </div>
    `;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Printer className="h-5 w-5 mr-2 text-blue-600" />
                Print Receipt
              </h2>
              <p className="text-gray-600 text-sm mt-1">Receipt #{sale.id.slice(0, 8)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Receipt Preview */}
        <div className="p-6">
          <div className="bg-white border border-gray-300 rounded-lg p-4 font-mono text-sm max-w-xs mx-auto" style={{ fontFamily: 'Courier New, monospace' }}>
            {/* Store Header */}
            <div className="text-center border-b-2 border-black pb-3 mb-4">
              <div className="text-lg font-bold">FOREIGN FITS</div>
              <div className="text-xs">Global Fashion Collection</div>
              <div className="text-xs mt-2">
                123 Fashion Street, Style City<br />
                Phone: (555) 123-4567
              </div>
            </div>

            {/* Receipt Info */}
            <div className="text-xs mb-4">
              <div><strong>Receipt #:</strong> {sale.id.slice(0, 8).toUpperCase()}</div>
              <div><strong>Date:</strong> {new Date(sale.createdAt).toLocaleDateString()}</div>
              <div><strong>Time:</strong> {new Date(sale.createdAt).toLocaleTimeString()}</div>
              <div><strong>Customer:</strong> {sale.customerName || 'Walk-in Customer'}</div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-dashed border-black py-3 mb-4">
              <div className="font-bold text-center mb-3">ITEMS PURCHASED</div>
              {sale.items.map((item, index) => (
                <div key={index} className="mb-3">
                  <div className="flex justify-between">
                    <div className="flex-1">
                      <div className="text-xs font-medium">{item.product.name}</div>
                      <div className="text-xs text-gray-600">{item.product.size} - {item.product.color}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{item.quantity} × ₹{item.price.toFixed(2)}</div>
                      <div className="font-bold text-gray-900">₹{item.total.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{sale.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (18% GST):</span>
                <span>₹{sale.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                <span>TOTAL:</span>
                <span className="text-green-600">₹{sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="text-center border-t border-b border-dashed border-black py-3 mb-4">
              <div className="font-bold text-xs mb-1">PAYMENT METHOD</div>
              <div className="uppercase font-bold">{sale.paymentMethod}</div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs">
              <div className="font-bold mb-2">THANK YOU!</div>
              <div className="mb-2">Visit us again for latest fashion</div>
              <div className="text-xs">Returns within 30 days with receipt</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}