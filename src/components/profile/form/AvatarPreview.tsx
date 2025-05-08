
import AvatarUpload from "./AvatarUpload";

interface AvatarPreviewProps {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  onAvatarChange: (url: string) => void;
}

const AvatarPreview = ({ avatarUrl, firstName, lastName, onAvatarChange }: AvatarPreviewProps) => {
  return (
    <div className="flex justify-center mb-4">
      <AvatarUpload
        avatarUrl={avatarUrl}
        firstName={firstName}
        lastName={lastName}
        onAvatarChange={onAvatarChange}
      />
    </div>
  );
};

export default AvatarPreview;
