
import { OrganizationWithLocation } from "@/types";
import OrganizationHeader from "./OrganizationHeader";
import OrganizationDescription from "./OrganizationDescription";
import OrganizationWebsite from "./OrganizationWebsite";

interface OrganizationInfoProps {
  organization: OrganizationWithLocation;
}

const OrganizationInfo = ({ organization }: OrganizationInfoProps) => {
  return (
    <div>
      <OrganizationHeader organization={organization} />
      <OrganizationDescription description={organization.description} />
      <OrganizationWebsite websiteUrl={organization.website_url} />
    </div>
  );
};

export default OrganizationInfo;
