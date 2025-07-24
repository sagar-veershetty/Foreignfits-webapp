import React, { useEffect, useRef, useState, useCallback } from 'react';
import Quagga from 'quagga';
import { Camera, X, Zap } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({ onScan, onClose, isOpen }: BarcodeScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const isQuaggaInitialized = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDetected = useCallback((result: any) => {
    const code = result.codeResult.code;
    if (code) {
      onScan(code);
      stopScanner();
    }
  }, [onScan]);

  const stopScanner = useCallback(() => {
    if (isQuaggaInitialized.current) {
      try {
        Quagga.offDetected(handleDetected);
        Quagga.stop();
        isQuaggaInitialized.current = false;
      } catch (error) {
        console.warn('Error stopping Quagga:', error);
      }
    }
    setIsScanning(false);
  }, [handleDetected]);

  const startScanner = useCallback(() => {
    if (!scannerRef.current) return;

    setIsScanning(true);
    setError(null);
    isQuaggaInitialized.current = false;

    Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: scannerRef.current,
        constraints: {
          width: 640,
          height: 480,
          facingMode: "environment"
        }
      },
      decoder: {
        readers: [
          "code_128_reader",
          "ean_reader",
          "ean_8_reader",
          "code_39_reader",
          "code_39_vin_reader",
          "codabar_reader",
          "upc_reader",
          "upc_e_reader",
          "i2of5_reader"
        ]
      },
      locate: true,
      locator: {
        patchSize: "medium",
        halfSample: true
      }
    }, (err) => {
      if (err) {
        console.error('Scanner initialization error:', err);
        setError('Failed to initialize camera. Please check permissions.');
        setIsScanning(false);
        isQuaggaInitialized.current = false;
        return;
      }
      
      try {
        Quagga.start();
        isQuaggaInitialized.current = true;
        Quagga.onDetected(handleDetected);
      } catch (startError) {
        console.error('Scanner start error:', startError);
        setError('Failed to start camera scanner.');
        setIsScanning(false);
        isQuaggaInitialized.current = false;
      }
    });
  }, [handleDetected]);

  useEffect(() => {
    if (isOpen && scannerRef.current) {
      startScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Camera className="h-5 w-5 mr-2" />
            Barcode Scanner
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-4">
              <Camera className="h-12 w-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Camera Error</p>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
            </div>
            <button
              onClick={startScanner}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div 
              ref={scannerRef} 
              className="relative bg-black rounded-lg overflow-hidden mb-4"
              style={{ height: '300px' }}
            >
              {!isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-white text-center">
                    <Zap className="h-8 w-8 mx-auto mb-2 animate-pulse" />
                    <p>Initializing camera...</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Position the barcode within the camera view to scan
              </p>
              <button
                onClick={onClose}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}