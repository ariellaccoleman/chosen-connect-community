
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "@/components/ui/sonner";

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

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      if (!user?.id) {
        throw new Error("You must be logged in to upload an avatar.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

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
        onAvatarChange(publicURL.publicUrl);
        toast.success("Avatar uploaded successfully!");
      }
    } catch (error: any) {
      toast.error(error.message || "Error uploading avatar");
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = () => {
    onAvatarChange("");
    toast.success("Avatar removed. Save your profile to confirm.");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-32 h-32 relative bg-gray-50 rounded-full overflow-hidden">
        {avatarUrl ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <img 
              src={avatarUrl} 
              alt="Profile avatar" 
              className="object-cover w-full h-full"
            />
          </div>
        ) : (
          <Avatar className="h-32 w-32">
            <AvatarFallback className="bg-chosen-gold text-chosen-navy text-2xl">
              {firstInitial}{lastInitial}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
      
      <div className="flex gap-2">
        <Button 
          type="button"
          variant="outline" 
          size="sm" 
          className="flex items-center gap-2"
          disabled={uploading}
          onClick={() => document.getElementById("avatar-upload")?.click()}
        >
          <Upload size={16} />
          {uploading ? "Uploading..." : "Upload"}
        </Button>
        
        {avatarUrl && (
          <Button 
            type="button"
            variant="destructive" 
            size="sm"
            onClick={removeAvatar}
          >
            <X size={16} className="mr-1" />
            Remove
          </Button>
        )}
      </div>
      
      <input
        id="avatar-upload"
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        className="hidden"
      />
      
      <p className="text-xs text-muted-foreground">
        Upload an image (max 8MB)
      </p>
    </div>
  );
};

export default AvatarUpload;
