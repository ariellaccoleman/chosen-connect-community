
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AdminTagsHeaderProps {
  onOpenCreateForm: () => void;
}

const AdminTagsHeader = ({ onOpenCreateForm }: AdminTagsHeaderProps) => {
  return (
    <>
      <Link to="/admin" className="text-sm text-muted-foreground hover:underline">
        ← Back to Admin Dashboard
      </Link>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-4 font-heading">Manage Tags</h1>
          <p className="text-muted-foreground mb-6">
            Create, edit, and manage tags for users and organizations.
          </p>
        </div>
        <Button onClick={onOpenCreateForm} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Tag
        </Button>
      </div>
    </>
  );
};

export default AdminTagsHeader;
