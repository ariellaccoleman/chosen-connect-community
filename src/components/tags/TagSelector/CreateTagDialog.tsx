
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
    // Ensure we pass the name property explicitly, making it non-optional for TypeScript
    const tag = await createTag({
      name: values.name, // This ensures name is passed as a required property
      description: values.description
    }, targetType);
    
    if (tag) {
      onClose();
    }
  };

  // First create the object with default values
  const values = {
    name: initialValue || "",
    description: ""
  };
  // Then assert that this object satisfies the TagFormValues type
  const formInitialValues = values as TagFormValues;

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
