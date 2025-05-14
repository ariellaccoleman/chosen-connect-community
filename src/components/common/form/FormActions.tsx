
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

  const handleButtonClick = () => {
    console.log("Submit button clicked");
    logger.info("Submit button clicked");
    
    if (formId) {
      console.log(`Triggering submit on form with id: ${formId}`);
      logger.info(`Triggering submit on form with id: ${formId}`);
      
      // Find the form and submit it
      const form = document.getElementById(formId) as HTMLFormElement;
      if (form) {
        console.log("Form found, submitting programmatically");
        logger.info("Form found, submitting programmatically");
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      } else {
        console.error(`Form with id ${formId} not found`);
        logger.error(`Form with id ${formId} not found`);
      }
    }
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
        onClick={handleButtonClick}
      >
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
};

export default FormActions;
