
import React from "react";
import { User } from "@supabase/supabase-js";
import CreateTagButton from "./CreateTagButton";

interface EmptySearchStateProps {
  searchValue: string;
  handleOpenCreateDialog: () => void;
  user: User | null;
}

const EmptySearchState = ({
  searchValue,
  handleOpenCreateDialog,
  user
}: EmptySearchStateProps) => {
  return (
    <div className="py-6 text-center text-sm">
      <p className="text-muted-foreground">No tags found</p>
      <CreateTagButton 
        searchValue={searchValue}
        handleOpenCreateDialog={handleOpenCreateDialog}
        user={user}
      />
    </div>
  );
};

export default EmptySearchState;
