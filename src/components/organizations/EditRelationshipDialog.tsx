
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  useUpdateOrganizationRelationship, 
  useDeleteOrganizationRelationship 
} from "@/hooks/useOrganizations";
import { OrganizationRelationshipWithDetails } from "@/types";

interface EditRelationshipDialogProps {
  relationship: OrganizationRelationshipWithDetails;
  isOpen: boolean;
  onClose: () => void;
}

const EditRelationshipDialog = ({
  relationship,
  isOpen,
  onClose
}: EditRelationshipDialogProps) => {
  const [connectionType, setConnectionType] = useState<"current" | "former" | "connected_insider">(
    (relationship.connection_type as "current" | "former" | "connected_insider") || "current"
  );
  const [department, setDepartment] = useState(relationship.department || "");
  const [notes, setNotes] = useState(relationship.notes || "");
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  
  const updateRelationship = useUpdateOrganizationRelationship();
  const deleteRelationship = useDeleteOrganizationRelationship();

  useEffect(() => {
    // Reset form when relationship changes
    setConnectionType((relationship.connection_type as "current" | "former" | "connected_insider") || "current");
    setDepartment(relationship.department || "");
    setNotes(relationship.notes || "");
  }, [relationship]);

  const handleSave = async () => {
    try {
      await updateRelationship.mutateAsync({
        relationshipId: relationship.id,
        relationshipData: {
          connection_type: connectionType,
          department: department || null,
          notes: notes || null
        }
      });
      
      onClose();
    } catch (error) {
      console.error("Error updating relationship:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRelationship.mutateAsync(relationship.id);
      setIsConfirmDeleteOpen(false);
      onClose();
    } catch (error) {
      console.error("Error deleting relationship:", error);
    }
  };

  if (!relationship.organization) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Connection with {relationship.organization.name}</DialogTitle>
            <DialogDescription>
              Update your relationship with this organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="connection-type">Connection Type</Label>
              <Select 
                value={connectionType} 
                onValueChange={(value: "current" | "former" | "connected_insider") => setConnectionType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select connection type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Current Member</SelectItem>
                  <SelectItem value="former">Former Member</SelectItem>
                  <SelectItem value="connected_insider">Connected Insider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Input 
                id="department" 
                placeholder="e.g., Marketing, Engineering" 
                value={department} 
                onChange={(e) => setDepartment(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional details about your connection"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            <Button 
              variant="destructive" 
              onClick={() => setIsConfirmDeleteOpen(true)}
              disabled={updateRelationship.isPending || deleteRelationship.isPending}
            >
              Remove Connection
            </Button>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                className="bg-chosen-blue" 
                onClick={handleSave}
                disabled={updateRelationship.isPending}
              >
                {updateRelationship.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Connection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your connection with {relationship.organization.name}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDelete}
            >
              {deleteRelationship.isPending ? "Removing..." : "Yes, Remove Connection"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditRelationshipDialog;
