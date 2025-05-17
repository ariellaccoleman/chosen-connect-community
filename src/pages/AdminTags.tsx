
import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Use consolidated tag hooks
import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";

// Import the components
import AdminTagsHeader from "@/components/admin/tags/AdminTagsHeader";
import TagForm, { TagFormValues } from "@/components/admin/tags/TagForm";
import TagsTable from "@/components/admin/tags/TagsTable";

const AdminTags = () => {
  const queryClient = useQueryClient();
  const { data: tagsResponse, isLoading } = useSelectionTags();
  const { createTag, isCreating } = useTagCrudMutations();
  const { isAdmin, loading } = useAuth();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  // Extract the actual tags array from the API response
  const tags = tagsResponse?.data || [];

  const handleOpenCreateForm = () => setIsCreateFormOpen(true);
  const handleCloseCreateForm = () => setIsCreateFormOpen(false);

  const handleCreateTag = async (values: TagFormValues) => {
    try {
      await createTag({
        name: values.name,
        description: values.description,
        type: values.type
      });
      
      toast.success("Tag created successfully!");
      handleCloseCreateForm();
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error: any) {
      toast.error(`Failed to create tag: ${error?.message || "Unknown error"}`);
    }
  };

  // If still loading, show loading state
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto py-6" data-testid="admin-tags-container">
      <AdminTagsHeader onOpenCreateForm={handleOpenCreateForm} />
      
      <TagForm 
        isOpen={isCreateFormOpen}
        onClose={handleCloseCreateForm}
        onSubmit={handleCreateTag}
        isSubmitting={isCreating}
      />

      <TagsTable tags={tags} isLoading={isLoading} />
    </div>
  );
};

export default AdminTags;
