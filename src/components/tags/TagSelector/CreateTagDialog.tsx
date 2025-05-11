
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/components/ui/sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { Tag, TAG_TYPES, createTag } from "@/utils/tags";

interface CreateTagDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialValue?: string;
  targetType: "person" | "organization";
  onTagCreated: (tag: Tag) => void;
  isAdmin?: boolean;
}

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().default(false),
});

type CreateTagFormValues = z.infer<typeof createTagSchema>;

const CreateTagDialog = ({
  isOpen,
  onClose,
  initialValue = "",
  targetType,
  onTagCreated,
  isAdmin = false
}: CreateTagDialogProps) => {
  const { user } = useAuth();

  const form = useForm<CreateTagFormValues>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: initialValue,
      description: "",
      is_public: false,
    },
  });

  // Handle creating a new tag
  const handleCreateTag = async (values: CreateTagFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in to create tags");
      return;
    }
    
    try {
      const newTag = await createTag({
        name: values.name,
        description: values.description || null,
        type: targetType === "person" ? TAG_TYPES.PERSON : TAG_TYPES.ORGANIZATION,
        is_public: values.is_public,
        created_by: user.id,
      });

      if (newTag) {
        toast.success(`Tag "${newTag.name}" created successfully`);
        form.reset();
        onClose();
        onTagCreated(newTag);
      } else {
        toast.error("Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag. Please try again.");
    }
  };

  // Reset form with initialValue when dialog opens
  React.useEffect(() => {
    if (isOpen) {
      form.setValue("name", initialValue);
    }
  }, [isOpen, initialValue, form]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new tag</DialogTitle>
          <DialogDescription>
            Add a new tag for {targetType === "person" ? "people" : "organizations"}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isAdmin && (
              <FormField
                control={form.control}
                name="is_public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>Make public</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Public tags are available for everyone to select
                      </p>
                    </div>
                    <FormControl>
                      <Switch 
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Tag</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTagDialog;
