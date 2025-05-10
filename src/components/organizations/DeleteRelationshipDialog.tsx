
import { useState } from "react";
import { useDeleteOrganizationRelationship } from "@/hooks/useOrganizationMutations";
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

interface DeleteRelationshipDialogProps {
  organizationName: string | undefined;
  relationshipId: string;
  onDeleteSuccess: () => void;
}

const DeleteRelationshipDialog = ({
  organizationName,
  relationshipId,
  onDeleteSuccess,
}: DeleteRelationshipDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const deleteRelationship = useDeleteOrganizationRelationship();

  const handleDelete = async () => {
    await deleteRelationship.mutateAsync(relationshipId);
    setIsOpen(false);
    onDeleteSuccess();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
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
