
import React, { useRef, useState } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { compressImage } from './imageUtils';

interface ImageCropperProps {
  imageSrc: string;
  aspect?: number;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
  open: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const ImageCropper = ({ 
  imageSrc, 
  aspect = 1, 
  onCropComplete, 
  onCancel,
  open
}: ImageCropperProps) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  
  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspect));
  };

  const handleCropComplete = async () => {
    if (!completedCrop || !imgRef.current) return;
    
    setIsProcessing(true);

    try {
      const canvas = document.createElement('canvas');
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height,
      );

      // Get the cropped image as blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => {
          if (!b) throw new Error('Canvas to Blob conversion failed');
          resolve(b);
        }, 'image/jpeg');
      });
      
      // Compress the cropped image
      const compressedBlob = await compressImage(blob, 1200, 1200, 0.85);
      
      // Convert to data URL
      const reader = new FileReader();
      reader.readAsDataURL(compressedBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        onCropComplete(base64data);
        setIsProcessing(false);
      };
    } catch (error) {
      console.error("Error processing cropped image:", error);
      // Fixed: Define canvas properly within the error handling scope
      const canvas = document.createElement('canvas');
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCropComplete(dataUrl);
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-screen-md">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        <div className="flex items-center justify-center p-4">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            className="max-h-[70vh]"
          >
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-h-[70vh] object-contain"
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>Cancel</Button>
          <Button 
            onClick={handleCropComplete} 
            disabled={isProcessing || !completedCrop}
          >
            {isProcessing ? (
              <>
                <span className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin mr-2"></span>
                Processing...
              </>
            ) : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
