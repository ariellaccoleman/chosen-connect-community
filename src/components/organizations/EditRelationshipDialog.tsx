
import { useUpdateOrganizationRelationship } from "@/hooks/useOrganizationMutations";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";
import DeleteRelationshipDialog from "./DeleteRelationshipDialog";
import RelationshipForm, { RelationshipFormValues } from "./RelationshipForm";

interface EditRelationshipDialogProps {
  relationship: ProfileOrganizationRelationshipWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

const EditRelationshipDialog = ({ relationship, isOpen, onClose }: EditRelationshipDialogProps) => {
  const updateRelationship = useUpdateOrganizationRelationship();

  const handleSubmit = async (values: RelationshipFormValues) => {
    await updateRelationship.mutateAsync({
      id: relationship.id,
      data: {
        connection_type: values.connection_type,
        department: values.department || null,
        notes: values.notes || null
      }
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Organization Connection</DialogTitle>
          <DialogDescription>
            Update your relationship with {relationship.organization?.name}
          </DialogDescription>
        </DialogHeader>

        <RelationshipForm 
          relationship={relationship}
          onSubmit={handleSubmit}
          isSubmitting={updateRelationship.isPending}
          onCancel={onClose}
        />

        <DialogFooter className="flex justify-between sm:justify-between mt-4">
          <DeleteRelationshipDialog 
            organizationName={relationship.organization?.name}
            relationshipId={relationship.id}
            onDeleteSuccess={onClose}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditRelationshipDialog;
