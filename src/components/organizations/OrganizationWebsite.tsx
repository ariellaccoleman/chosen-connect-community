
import { LinkIcon } from "lucide-react";
import { formatWebsiteUrl } from "@/utils/formatters";

interface OrganizationWebsiteProps {
  websiteUrl: string | null;
}

const OrganizationWebsite = ({ websiteUrl }: OrganizationWebsiteProps) => {
  if (!websiteUrl) return null;
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">Website</h2>
      <a
        href={formatWebsiteUrl(websiteUrl)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline flex items-center break-all"
      >
        <LinkIcon className="h-4 w-4 mr-2 flex-shrink-0" />
        {websiteUrl}
      </a>
    </div>
  );
};

export default OrganizationWebsite;
