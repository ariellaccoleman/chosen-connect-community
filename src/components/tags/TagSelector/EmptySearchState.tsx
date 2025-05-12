
import React from "react";
import { User } from "@supabase/supabase-js";

interface EmptySearchStateProps {
  searchValue: string;
  handleOpenCreateDialog: () => void;
  user: User | null;
}

const EmptySearchState = ({ 
  searchValue
}: EmptySearchStateProps) => {
  return (
    <div className="py-6 text-center">
      <p className="text-sm">
        No tags found for "<span className="font-medium">{searchValue}</span>"
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        Try a different search term or create a new tag using the button below.
      </p>
    </div>
  );
};

export default EmptySearchState;

