
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tag, findOrCreateTag } from "@/utils/tags";
import { EntityType } from "@/types/entityTypes";
import { toast } from "sonner";

interface CreateTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  targetType: EntityType;
  onTagCreated: (tag: Tag) => void;
  isAdmin?: boolean;
}

const CreateTagDialog = ({
  isOpen,
  onClose,
  initialValue = "",
  targetType,
  onTagCreated,
  isAdmin = false
}: CreateTagDialogProps) => {
  const [name, setName] = useState(initialValue);
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create tags");
      onClose();
      navigate("/auth", { state: { from: window.location.pathname } });
      return;
    }
    
    if (!name.trim()) {
      return;
    }
    
    setIsCreating(true);
    
    try {
      // Only pass the tag data - entity type associations are handled by triggers
      const createdTag = await findOrCreateTag({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id
      });
      
      if (createdTag) {
        onTagCreated(createdTag);
        onClose();
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error(`Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsCreating(false);
    }
  };

  const resetAndClose = () => {
    setName(initialValue);
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={resetAndClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tag name"
              className="w-full"
              autoFocus
              required
            />
          </div>
          
          <div>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="resize-none h-24"
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? "Creating..." : "Create Tag"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTagDialog;
