
import { MapPin } from "lucide-react";
import { OrganizationWithLocation } from "@/types";
import OrganizationLogo from "./OrganizationLogo";

interface OrganizationHeaderProps {
  organization: OrganizationWithLocation;
}

const OrganizationHeader = ({ organization }: OrganizationHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
      <div className="flex items-center gap-4">
        <OrganizationLogo 
          logoUrl={organization.logo_url} 
          name={organization.name} 
        />
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          {organization.location && organization.location.formatted_location && (
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {organization.location.formatted_location}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationHeader;
