
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X, Building } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";

interface LogoUploadProps {
  logoUrl: string | null | undefined;
  organizationName: string;
  onLogoChange: (url: string) => void;
}

const LogoUpload = ({ logoUrl, organizationName, onLogoChange }: LogoUploadProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  
  const uploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      if (!user?.id) {
        throw new Error("You must be logged in to upload a logo.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `org_logos/${organizationName.replace(/\s+/g, '_')}_${Date.now()}.${fileExt}`;

      // Check if file is an image
      if (!file.type.match('image.*')) {
        throw new Error("Please select an image file.");
      }

      // Check file size (limit to 8MB)
      if (file.size > 8 * 1024 * 1024) {
        throw new Error("File size must be less than 8MB.");
      }

      const { error: uploadError, data } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: publicURL } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      if (publicURL) {
        onLogoChange(publicURL.publicUrl);
        toast.success("Logo uploaded successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Error uploading logo");
      console.error("Error uploading logo:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeLogo = () => {
    onLogoChange("");
    toast.success("Logo removed. Save your changes to confirm.");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-32 h-32 relative bg-gray-50 rounded-md border overflow-hidden">
        <AspectRatio ratio={1} className="h-full w-full">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${organizationName} logo`}
              className="object-contain h-full w-full"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <Building className="h-16 w-16 text-gray-400" />
            </div>
          )}
        </AspectRatio>
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={uploading}
          onClick={() => document.getElementById("logo-upload")?.click()}
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : "Upload Logo"}
        </Button>
        
        {logoUrl && (
          <Button 
            type="button"
            variant="destructive" 
            size="sm"
            onClick={removeLogo}
          >
            <X size={16} className="mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        onChange={uploadLogo}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Upload a logo image (max 8MB)
      </p>
    </div>
  );
};

export default LogoUpload;
