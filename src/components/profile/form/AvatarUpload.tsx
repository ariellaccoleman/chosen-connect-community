
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { EnhancedImageUpload } from "@/components/ui/enhanced-image-upload";

interface AvatarUploadProps {
  avatarUrl: string | null | undefined;
  firstName?: string | null;
  lastName?: string | null;
  onAvatarChange: (url: string) => void;
}

const AvatarUpload = ({ avatarUrl, firstName, lastName, onAvatarChange }: AvatarUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';

  const handleImageChange = async (imageData: string) => {
    // If it's an empty string, just remove the avatar
    if (!imageData) {
      onAvatarChange("");
      return;
    }
    
    try {
      setUploading(true);
      
      if (!user?.id) {
        throw new Error("You must be logged in to upload an avatar.");
      }

      // Convert base64 to blob
      const fetchResponse = await fetch(imageData);
      const blob = await fetchResponse.blob();
      
      // Create a file from the blob
      const file = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const fileExt = 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicURL } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      if (publicURL) {
        onAvatarChange(publicURL.publicUrl);
        toast.success("Avatar uploaded and cropped successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Error uploading avatar");
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  const placeholderIcon = firstInitial || lastInitial ? (
    <div className="h-16 w-16 bg-chosen-gold text-chosen-navy text-xl rounded-full flex items-center justify-center">
      {firstInitial}{lastInitial}
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col items-center space-y-4">
      <EnhancedImageUpload
        imageUrl={avatarUrl}
        onImageChange={handleImageChange}
        shape="circle"
        aspectRatio={1}
        maxSizeInMB={8}
        containerClassName="w-32 h-32"
        placeholderIcon={placeholderIcon}
      />
      
      <p className="text-xs text-muted-foreground">
        {uploading ? "Uploading..." : "Upload an image (max 8MB)"}
      </p>
    </div>
  );
};

export default AvatarUpload;
