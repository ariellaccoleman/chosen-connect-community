
import FormActions from "@/components/common/form/FormActions";

interface ProfileFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

const ProfileFormActions = ({ isSubmitting, onCancel }: ProfileFormActionsProps) => {
  return (
    <FormActions 
      isSubmitting={isSubmitting}
      onCancel={onCancel}
      submitLabel="Save Profile"
    />
  );
};

export default ProfileFormActions;
