
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tag } from "@/utils/tags";

// Schema for tag form
const tagSchema = z.object({
  name: z.string().min(2, {
    message: "Tag name must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

export type TagFormValues = z.infer<typeof tagSchema>;

interface TagFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: TagFormValues) => Promise<void>;
  isSubmitting: boolean;
  editingTag?: Tag | null;
}

const TagForm = ({ isOpen, onClose, onSubmit, isSubmitting, editingTag }: TagFormProps) => {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Update form when editing tag changes
  useEffect(() => {
    if (editingTag) {
      form.reset({
        name: editingTag.name,
        description: editingTag.description || "",
      });
    } else {
      form.reset({
        name: "",
        description: "",
      });
    }
  }, [editingTag, form]);

  const handleSubmit = async (values: TagFormValues) => {
    await onSubmit(values);
    if (!editingTag) {
      form.reset();
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTag ? 'Edit Tag' : 'Create New Tag'}
              </DialogTitle>
              <DialogDescription>
                {editingTag 
                  ? 'Update the tag information below.'
                  : 'Add a new tag to the database.'
                }
              </DialogDescription>
            </DialogHeader>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Name" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Tag Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </DialogContent>
          <div className="px-6 py-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? (editingTag ? "Updating..." : "Creating...")
                : (editingTag ? "Update Tag" : "Create Tag")
              }
            </Button>
          </div>
        </form>
      </Form>
    </Dialog>
  );
};

export default TagForm;
