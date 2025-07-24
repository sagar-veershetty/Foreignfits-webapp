import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeGeneratorProps {
  value: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
}

export function BarcodeGenerator({ 
  value, 
  width = 2, 
  height = 100, 
  displayValue = true 
}: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: "CODE128",
          width,
          height,
          displayValue,
          fontSize: 12,
          textMargin: 6,
          background: "#ffffff",
          lineColor: "#000000",
          margin: 0,
          textAlign: "center",
          textPosition: "bottom"
        });
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    }
  }, [value, width, height, displayValue]);

  if (!value) {
    return (
      <div className="flex items-center justify-center h-24 bg-gray-100 rounded border-2 border-dashed border-gray-300">
        <span className="text-gray-500 text-sm">No barcode data</span>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} className="border border-gray-200 rounded" />
    </div>
  );
}