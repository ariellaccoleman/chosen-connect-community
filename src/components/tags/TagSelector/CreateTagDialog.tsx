
import React from "react";
import { Tag } from "@/utils/tags";
import { useTagCreation } from "@/hooks/tag/useTagCreation";
import FormDialog from "@/components/common/form/FormDialog";
import TagForm, { TagFormValues } from "./TagForm";

interface CreateTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  targetType: "person" | "organization";
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
  const { createTag, isCreating } = useTagCreation({
    onTagCreated
  });

  const handleCreateTag = async (values: TagFormValues) => {
    const tag = await createTag(values, targetType);
    if (tag) {
      onClose();
    }
  };

  // Create a strongly typed initialValues object
  // By explicitly defining name as a non-optional string, we satisfy the type requirement
  const formInitialValues = {
    name: initialValue || "", // Ensure it's always a string, never undefined
    description: ""
  } as const; // Use 'as const' to make TypeScript treat this as exact types

  return (
    <FormDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create new tag"
      description={`Add a new tag for ${targetType === "person" ? "people" : "organizations"}.`}
    >
      <TagForm
        initialValues={formInitialValues}
        onSubmit={handleCreateTag}
        isSubmitting={isCreating}
        onCancel={onClose}
        isAdmin={isAdmin}
      />
    </FormDialog>
  );
};

export default CreateTagDialog;
