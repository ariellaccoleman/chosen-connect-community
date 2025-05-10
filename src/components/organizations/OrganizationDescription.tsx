
interface OrganizationDescriptionProps {
  description: string | null;
}

const OrganizationDescription = ({ description }: OrganizationDescriptionProps) => {
  if (!description) return null;
  
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold mb-2">About</h2>
      <p className="text-gray-700">{description}</p>
    </div>
  );
};

export default OrganizationDescription;
