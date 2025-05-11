
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TagCreateFooterProps {
  searchValue: string;
  handleOpenCreateDialog: () => void;
}

const TagCreateFooter = ({ searchValue, handleOpenCreateDialog }: TagCreateFooterProps) => {
  return (
    <div className="p-2 border-t">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleOpenCreateDialog}
      >
        <Plus className="mr-2 h-4 w-4" />
        Create new tag
      </Button>
    </div>
  );
};

export default TagCreateFooter;
