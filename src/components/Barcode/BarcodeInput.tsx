import React, { useState } from 'react';
import { Camera, Search } from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

interface BarcodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onScan?: (barcode: string) => void;
  placeholder?: string;
  className?: string;
}

export function BarcodeInput({ 
  value, 
  onChange, 
  onScan, 
  placeholder = "Enter or scan barcode",
  className = ""
}: BarcodeInputProps) {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (barcode: string) => {
    onChange(barcode);
    if (onScan) {
      onScan(barcode);
    }
    setShowScanner(false);
  };

  return (
    <>
      <div className={`relative ${className}`}>
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setShowScanner(true)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Scan barcode"
        >
          <Camera className="h-4 w-4" />
        </button>
      </div>

      <BarcodeScanner
        isOpen={showScanner}
        onScan={handleScan}
        onClose={() => setShowScanner(false)}
      />
    </>
  );
}