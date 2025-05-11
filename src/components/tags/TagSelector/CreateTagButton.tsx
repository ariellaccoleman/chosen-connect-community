
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";

interface CreateTagButtonProps {
  searchValue: string;
  handleOpenCreateDialog: () => void;
  user: User | null;
}

const CreateTagButton = ({ 
  searchValue, 
  handleOpenCreateDialog, 
  user 
}: CreateTagButtonProps) => {
  if (!user) {
    return (
      <p className="text-muted-foreground mt-2">
        Please log in to create tags
      </p>
    );
  }
  
  return (
    <Button
      variant="outline"
      className="mt-2"
      size="sm"
      onClick={handleOpenCreateDialog}
    >
      <Plus className="mr-2 h-4 w-4" />
      Create "{searchValue}"
    </Button>
  );
};

export default CreateTagButton;
