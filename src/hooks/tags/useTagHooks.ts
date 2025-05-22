
/**
 * Hook for CRUD operations on tags
 */
export function useTagCrudMutations() {
  const queryClient = useQueryClient();
  
  const createTagMutation = useMutation({
    mutationFn: (data: Partial<Tag>) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const updateTagMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Tag> }) => updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  const deleteTagMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    }
  });
  
  return {
    createTag: createTagMutation.mutate,
    updateTag: updateTagMutation.mutate,
    deleteTag: deleteTagMutation.mutate,
    isCreating: createTagMutation.isPending,
    isUpdating: updateTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
    error: createTagMutation.error || updateTagMutation.error || deleteTagMutation.error
  };
}
