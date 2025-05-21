
import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";

// Use consolidated tag hooks
import { useSelectionTags, useTagCrudMutations } from "@/hooks/tags";

// Import the hub hooks
import { useHubs, useCreateHub, useDeleteHub } from "@/hooks/hubs";

// Import the components
import AdminTagsHeader from "@/components/admin/tags/AdminTagsHeader";
import TagForm, { TagFormValues } from "@/components/admin/tags/TagForm";
import TagsTable from "@/components/admin/tags/TagsTable";

const AdminTags = () => {
  const queryClient = useQueryClient();
  const { data: tagsResponse, isLoading: isTagsLoading } = useSelectionTags();
  const { data: hubsData, isLoading: isHubsLoading } = useHubs();
  const { createTag, isCreating } = useTagCrudMutations();
  const { isAdmin, loading, user } = useAuth();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [processingHubTags, setProcessingHubTags] = useState<{[key: string]: boolean}>({});
  const createHub = useCreateHub();
  const deleteHub = useDeleteHub();

  // Extract the actual tags array from the API response
  const tags = tagsResponse?.data || [];
  
  // Extract hub tag IDs
  const hubTagIds = (hubsData?.data || []).map(hub => hub.tag_id).filter(Boolean);

  const handleOpenCreateForm = () => setIsCreateFormOpen(true);
  const handleCloseCreateForm = () => setIsCreateFormOpen(false);

  const handleCreateTag = async (values: TagFormValues) => {
    try {
      // Create the tag first
      const tagResponse = await createTag({
        name: values.name,
        description: values.description,
        created_by: user?.id // Add the created_by property with the current user's ID
      });
      
      // Then associate it with the selected entity type
      if (tagResponse && values.entityType) {
        try {
          const { updateTagEntityType } = await import("@/utils/tags/tagOperations");
          await updateTagEntityType(tagResponse.id, values.entityType);
        } catch (entityTypeError) {
          console.error("Error setting entity type:", entityTypeError);
          // Continue even if this fails
        }
      }
      
      toast.success("Tag created successfully!");
      handleCloseCreateForm();
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error: any) {
      toast.error(`Failed to create tag: ${error?.message || "Unknown error"}`);
    }
  };

  // Make a tag into a hub
  const handleMakeHub = async (tagId: string) => {
    try {
      setProcessingHubTags(prev => ({ ...prev, [tagId]: true }));
      
      // Find the tag to get its name and description
      const tag = tags.find(t => t.id === tagId);
      if (!tag) throw new Error("Tag not found");
      
      // Create a hub with this tag
      await createHub.mutateAsync({
        name: tag.name,
        description: tag.description || '',
        tag_id: tagId,
        is_featured: false
      });
      
      toast.success(`${tag.name} is now a hub!`);
      queryClient.invalidateQueries({ queryKey: ["hubs"] });
    } catch (error: any) {
      toast.error(`Failed to create hub: ${error?.message || "Unknown error"}`);
    } finally {
      setProcessingHubTags(prev => ({ ...prev, [tagId]: false }));
    }
  };

  // Remove a tag from hubs
  const handleRemoveHub = async (tagId: string) => {
    try {
      setProcessingHubTags(prev => ({ ...prev, [tagId]: true }));
      
      // Find the hub with this tag ID
      const hub = (hubsData?.data || []).find(h => h.tag_id === tagId);
      if (!hub) throw new Error("Hub not found");
      
      // Delete the hub
      await deleteHub.mutateAsync(hub.id);
      
      toast.success("Hub removed successfully!");
      queryClient.invalidateQueries({ queryKey: ["hubs"] });
    } catch (error: any) {
      toast.error(`Failed to remove hub: ${error?.message || "Unknown error"}`);
    } finally {
      setProcessingHubTags(prev => ({ ...prev, [tagId]: false }));
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

  const isLoading = isTagsLoading || isHubsLoading;

  return (
    <div className="container mx-auto py-6" data-testid="admin-tags-container">
      <AdminTagsHeader onOpenCreateForm={handleOpenCreateForm} />
      
      <TagForm 
        isOpen={isCreateFormOpen}
        onClose={handleCloseCreateForm}
        onSubmit={handleCreateTag}
        isSubmitting={isCreating}
      />

      <TagsTable 
        tags={tags} 
        isLoading={isLoading} 
        onMakeHub={handleMakeHub}
        onRemoveHub={handleRemoveHub}
        hubTagIds={hubTagIds}
        isProcessing={processingHubTags}
      />
    </div>
  );
};

export default AdminTags;
