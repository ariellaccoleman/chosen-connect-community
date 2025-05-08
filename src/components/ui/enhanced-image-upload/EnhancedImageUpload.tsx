
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from '@/components/ui/sonner';
import { ImageCropper } from './ImageCropper';
import { Button } from '@/components/ui/button';
import { Upload, X, Move, CropIcon } from 'lucide-react';

interface EnhancedImageUploadProps {
  imageUrl: string | null | undefined;
  onImageChange: (url: string) => void;
  aspectRatio?: number;
  maxSizeInMB?: number;
  shape?: 'square' | 'circle';
  containerClassName?: string;
  placeholderIcon?: React.ReactNode;
  acceptedFileTypes?: string[];
}

export const EnhancedImageUpload = ({
  imageUrl,
  onImageChange,
  aspectRatio = 1,
  maxSizeInMB = 8,
  shape = 'circle',
  containerClassName = '',
  placeholderIcon,
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
}: EnhancedImageUploadProps) => {
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size must be less than ${maxSizeInMB}MB.`);
      return;
    }

    // Create temporary URL for preview
    const objectUrl = URL.createObjectURL(file);
    setTempImageUrl(objectUrl);
    setCropperOpen(true);
  }, [maxSizeInMB]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': acceptedFileTypes
    },
    maxSize: maxSizeInMB * 1024 * 1024,
    multiple: false
  });

  const handleCropComplete = (croppedImage: string) => {
    onImageChange(croppedImage);
    setCropperOpen(false);
    
    // Clean up the temporary object URL
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
    
    toast.success("Image cropped successfully!");
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    
    // Clean up the temporary object URL
    if (tempImageUrl) {
      URL.revokeObjectURL(tempImageUrl);
      setTempImageUrl(null);
    }
  };
  
  const handleRemoveImage = () => {
    onImageChange("");
    toast.success("Image removed.");
  };

  const handleReCrop = () => {
    if (imageUrl) {
      setTempImageUrl(imageUrl);
      setCropperOpen(true);
    }
  };

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-md';
  const dragClass = isDragActive ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200';

  return (
    <div className="flex flex-col items-center space-y-4">
      <div 
        className={`relative bg-gray-50 border-2 border-dashed ${dragClass} ${shapeClass} overflow-hidden ${containerClassName}`}
        {...getRootProps()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDragEnd={() => setIsDragging(false)}
      >
        <input {...getInputProps()} />
        
        {imageUrl ? (
          <div className="h-full w-full flex items-center justify-center">
            <img 
              src={imageUrl} 
              alt="Uploaded image" 
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-opacity flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); handleReCrop(); }}>
                  <CropIcon className="h-4 w-4 mr-1" />
                  Crop
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 p-4">
            {isDragActive ? (
              <>
                <Move className="h-8 w-8 mb-2" />
                <p className="text-sm text-center">Drop image here</p>
              </>
            ) : (
              <>
                {placeholderIcon || <Upload className="h-8 w-8 mb-2" />}
                <p className="text-sm text-center">Drag & drop or click to upload</p>
                <p className="text-xs text-center text-muted-foreground mt-1">
                  Max size: {maxSizeInMB}MB
                </p>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Actions */}
      {imageUrl && (
        <Button 
          type="button"
          variant="destructive" 
          size="sm"
          onClick={handleRemoveImage}
          className="mt-2"
        >
          <X size={16} className="mr-1" />
          Remove
        </Button>
      )}
      
      {/* Cropper dialog */}
      {tempImageUrl && (
        <ImageCropper 
          imageSrc={tempImageUrl}
          aspect={aspectRatio}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          open={cropperOpen}
        />
      )}
    </div>
  );
};
