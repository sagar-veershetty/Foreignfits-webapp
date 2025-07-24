import React, { useState } from 'react';
import { Upload, X, Plus, Image as ImageIcon } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  className?: string;
}

export function MultiImageUpload({ 
  images, 
  onChange, 
  maxImages = 5,
  className = "" 
}: MultiImageUploadProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const remainingSlots = maxImages - images.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`Image "${file.name}" is too large. Maximum size is 5MB.`);
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert(`"${file.name}" is not a valid image file.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onChange([...images, result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    e.target.value = ''; // Reset input
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Product Images ({images.length}/{maxImages})
      </label>
      
      {images.length > 0 ? (
        <div className="space-y-4">
          {/* Image Carousel */}
          <ImageCarousel
            images={images}
            productName="Product"
            className="h-64"
            showControls={true}
            onImageRemove={removeImage}
            canRemove={true}
          />
          
          {/* Add More Images Button */}
          {canAddMore && (
            <div className="flex justify-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="hidden"
                id="add-more-images"
              />
              <label
                htmlFor="add-more-images"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add More Images ({maxImages - images.length} remaining)</span>
              </label>
            </div>
          )}
        </div>
      ) : (
        /* Upload Area */
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
            id="image-upload-multiple"
          />
          <label
            htmlFor="image-upload-multiple"
            className="cursor-pointer flex flex-col items-center space-y-3"
          >
            <div className="p-4 bg-gray-100 rounded-full">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                Upload Product Images
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Drag and drop images here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, GIF up to 5MB each • Maximum {maxImages} images
              </p>
            </div>
          </label>
        </div>
      )}
      
      {images.length >= maxImages && (
        <p className="text-sm text-amber-600 mt-2 flex items-center">
          <ImageIcon className="h-4 w-4 mr-1" />
          Maximum number of images reached. Remove an image to add more.
        </p>
      )}
    </div>
  );
}