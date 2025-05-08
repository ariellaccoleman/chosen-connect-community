
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileFormValues } from "./ProfileForm";
import AvatarPreview from "./form/AvatarPreview";
import NameFields from "./form/NameFields";
import LocationSelector from "./form/LocationSelector";
import ProfileFields from "./form/ProfileFields";

interface ProfileBasicInfoProps {
  form: UseFormReturn<ProfileFormValues>;
}

const ProfileBasicInfo = ({ form }: ProfileBasicInfoProps) => {
  const handleAvatarChange = (url: string) => {
    form.setValue("avatar_url", url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Update your personal information and how you appear in the community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar preview */}
        <AvatarPreview 
          avatarUrl={form.watch("avatar_url")}
          firstName={form.watch("first_name")}
          lastName={form.watch("last_name")}
          onAvatarChange={handleAvatarChange}
        />

        {/* Name Fields */}
        <NameFields form={form} />
        
        {/* Profile Fields */}
        <ProfileFields form={form} />
        
        {/* Location Selector */}
        <LocationSelector form={form} />
      </CardContent>
    </Card>
  );
};

export default ProfileBasicInfo;
