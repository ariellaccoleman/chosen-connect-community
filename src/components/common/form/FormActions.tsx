
import React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/utils/logger";

interface FormActionsProps {
  isSubmitting?: boolean;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  align?: "start" | "center" | "end";
  formId?: string;
}

/**
 * Standardized form actions component with submit and cancel buttons
 */
const FormActions = ({
  isSubmitting = false,
  onCancel,
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  className = "",
  align = "end",
  formId
}: FormActionsProps) => {
  const alignmentClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end"
  };

  return (
    <div className={cn(
      "flex space-x-4 mt-6", 
      alignmentClasses[align], 
      className
    )}>
      {onCancel && (
        <Button 
          type="button" 
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {cancelLabel}
        </Button>
      )}
      <Button 
        type="submit" 
        className="bg-chosen-blue hover:bg-chosen-navy"
        disabled={isSubmitting}
        form={formId}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
};

export default FormActions;
