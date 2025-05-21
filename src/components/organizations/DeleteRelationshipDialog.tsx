
import { useState } from "react";
import { useDeleteOrganizationRelationship } from "@/hooks/organizations";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ProfileOrganizationRelationshipWithDetails } from "@/types";

interface DeleteRelationshipDialogProps {
  organizationName: string | undefined;
  relationshipId: string;
  onDeleteSuccess: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const DeleteRelationshipDialog = ({
  organizationName,
  relationshipId,
  onDeleteSuccess,
  isOpen: externalIsOpen,
  onClose,
}: DeleteRelationshipDialogProps) => {
  const [isLocalOpen, setIsLocalOpen] = useState(false);
  const deleteRelationship = useDeleteOrganizationRelationship();

  // Determine if dialog is controlled externally or internally
  const isControlledExternally = externalIsOpen !== undefined && onClose !== undefined;
  const isOpen = isControlledExternally ? externalIsOpen : isLocalOpen;
  const handleOpenChange = isControlledExternally ? onClose : () => setIsLocalOpen(false);

  const handleDelete = async () => {
    await deleteRelationship.mutateAsync(relationshipId);
    if (isControlledExternally) {
      onClose?.();
    } else {
      setIsLocalOpen(false);
    }
    onDeleteSuccess();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      {!isControlledExternally && (
        <AlertDialogTrigger asChild>
          <Button 
            type="button" 
            variant="outline" 
            className="bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove Connection
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently remove your connection to {organizationName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={deleteRelationship.isPending}
          >
            {deleteRelationship.isPending ? "Removing..." : "Yes, remove it"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteRelationshipDialog;
