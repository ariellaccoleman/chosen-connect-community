
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AvatarPreviewProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}

const AvatarPreview = ({ avatarUrl, firstName, lastName }: AvatarPreviewProps) => {
  const firstInitial = firstName?.[0] || '';
  const lastInitial = lastName?.[0] || '';
  
  return (
    <div className="flex justify-center mb-4">
      <Avatar className="h-32 w-32">
        <AvatarImage src={avatarUrl || ""} />
        <AvatarFallback className="bg-chosen-gold text-chosen-navy text-2xl">
          {firstInitial}{lastInitial}
        </AvatarFallback>
      </Avatar>
    </div>
  );
};

export default AvatarPreview;
