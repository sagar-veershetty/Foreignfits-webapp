import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface ImageCarouselProps {
  images: string[];
  productName: string;
  className?: string;
  showControls?: boolean;
  onImageRemove?: (index: number) => void;
  canRemove?: boolean;
}

export function ImageCarousel({ 
  images, 
  productName, 
  className = "", 
  showControls = true,
  onImageRemove,
  canRemove = false
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center h-48 w-full ${className}`}>
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-gray-500 text-xl">📷</span>
          </div>
          <p className="text-gray-500 text-sm">No images</p>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToImage = (index: number) => {
    setCurrentIndex(index);
  };

  const handleRemoveImage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onImageRemove) {
      onImageRemove(index);
      // Adjust current index if needed
      if (index === currentIndex && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (index < currentIndex) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  };

  return (
    <div className={`relative h-48 w-full overflow-hidden ${className}`}>
      {/* Main Image */}
      <div className="relative h-full w-full overflow-hidden rounded-lg">
        <img
          src={images[currentIndex]}
          alt={`${productName} - Image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        {/* Remove Button */}
        {canRemove && onImageRemove && images.length > 0 && (
          <button
            onClick={(e) => handleRemoveImage(e, currentIndex)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            title="Remove this image"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Navigation Arrows */}
        {showControls && images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

    </div>
  );
}