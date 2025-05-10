
import { Building } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface OrganizationLogoProps {
  logoUrl: string | null;
  name: string;
}

const OrganizationLogo = ({ logoUrl, name }: OrganizationLogoProps) => {
  if (logoUrl) {
    return (
      <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-50 border">
        <AspectRatio ratio={1} className="h-full w-full">
          <img
            src={logoUrl}
            alt={name}
            className="h-full w-full object-contain"
          />
        </AspectRatio>
      </div>
    );
  }
  
  return (
    <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
      <Building className="h-8 w-8 text-gray-400" />
    </div>
  );
};

export default OrganizationLogo;
