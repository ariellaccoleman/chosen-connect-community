
import { Button } from "@/components/ui/button";
import { ProfileFormValues } from "../schema/profileSchema";

interface ProfileFormActionsProps {
  isSubmitting: boolean;
  onCancel: () => void;
}

const ProfileFormActions = ({ isSubmitting, onCancel }: ProfileFormActionsProps) => {
  return (
    <div className="flex justify-end space-x-4">
      <Button 
        type="button" 
        variant="outline"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="bg-chosen-blue hover:bg-chosen-navy"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
};

export default ProfileFormActions;
