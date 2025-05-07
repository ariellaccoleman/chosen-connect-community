
import { Building, LinkIcon, MapPin } from "lucide-react";
import { OrganizationWithLocation } from "@/types";
import { formatWebsiteUrl } from "@/utils/formatters";

interface OrganizationInfoProps {
  organization: OrganizationWithLocation;
}

const OrganizationInfo = ({ organization }: OrganizationInfoProps) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.name}
              className="h-16 w-16 rounded-md object-contain bg-gray-50"
            />
          ) : (
            <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
              <Building className="h-8 w-8 text-gray-400" />
            </div>
          )}
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

      {organization.description && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">About</h2>
          <p className="text-gray-700">{organization.description}</p>
        </div>
      )}

      {organization.website_url && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Website</h2>
          <a
            href={formatWebsiteUrl(organization.website_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline flex items-center break-all"
          >
            <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
            {organization.website_url}
          </a>
        </div>
      )}
    </div>
  );
};

export default OrganizationInfo;
