
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Building } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { EnhancedImageUpload } from "@/components/ui/enhanced-image-upload";

interface LogoUploadProps {
  logoUrl: string | null | undefined;
  organizationName: string;
  onLogoChange: (url: string) => void;
}

const LogoUpload = ({ logoUrl, organizationName, onLogoChange }: LogoUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  
  const handleImageChange = async (imageData: string) => {
    // If it's an empty string, just remove the logo
    if (!imageData) {
      onLogoChange("");
      return;
    }
    
    try {
      setUploading(true);
      
      if (!user?.id) {
        throw new Error("You must be logged in to upload a logo.");
      }

      // Convert base64 to blob
      const fetchResponse = await fetch(imageData);
      const blob = await fetchResponse.blob();
      
      // Create a file from the blob
      const file = new File([blob], `logo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      const fileExt = 'jpg';
      const filePath = `${organizationName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("org_logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicURL } = supabase.storage.from("org_logos").getPublicUrl(filePath);
      
      if (publicURL) {
        onLogoChange(publicURL.publicUrl);
        toast.success("Logo uploaded and cropped successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Error uploading logo");
      console.error("Error uploading logo:", error);
    } finally {
      setUploading(false);
    }
  };

  const placeholderIcon = <Building className="h-16 w-16 text-gray-400" />;

  return (
    <div className="flex flex-col items-center space-y-4">
      <EnhancedImageUpload
        imageUrl={logoUrl}
        onImageChange={handleImageChange}
        shape="square"
        aspectRatio={1}
        maxSizeInMB={8}
        containerClassName="w-32 h-32"
        placeholderIcon={placeholderIcon}
      />
      
      <p className="text-xs text-muted-foreground">
        {uploading ? "Uploading..." : "Upload a logo image (max 8MB)"}
      </p>
    </div>
  );
};

export default LogoUpload;
