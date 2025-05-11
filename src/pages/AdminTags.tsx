import React from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/sonner";
import { useTagMutations, useTags } from "@/hooks/useTags";
// Update the imports to use the correct Switch component
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TAG_TYPES } from "@/utils/tagUtils";

const tagSchema = z.object({
  name: z.string().min(2, {
    message: "Tag name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  type: z.enum([TAG_TYPES.PERSON, TAG_TYPES.ORGANIZATION]),
  is_public: z.boolean().default(false),
});

type TagValues = z.infer<typeof tagSchema>;

const AdminTags = () => {
  const queryClient = useQueryClient();
  const { data: tags, isLoading } = useTags();
  const { createTag: createTagMutation, isCreating } = useTagMutations();
  const { user, isAdmin } = useAuth();

  const form = useForm<TagValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
      type: TAG_TYPES.PERSON,
      is_public: false,
    },
  });

  const handleCreateTag = async (values: any) => {
    try {
      await createTagMutation({
        name: values.name,
        description: values.description,
        type: values.type,
        isPublic: values.is_public
      });
      
      toast.success("Tag created successfully!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    } catch (error: any) {
      toast.error(`Failed to create tag: ${error?.message || "Unknown error"}`);
    }
  };

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Link to="/admin" className="text-sm text-muted-foreground hover:underline">
          ← Back to Admin Dashboard
        </Link>
        <h1 className="text-3xl font-bold mb-4 font-heading">Manage Tags</h1>
        <p className="text-muted-foreground mb-6">
          Create, edit, and manage tags for users and organizations.
        </p>

        <Dialog>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-4">
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tag</DialogTitle>
                  <DialogDescription>
                    Add a new tag to the database.
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

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <select {...field} className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                          <option value={TAG_TYPES.PERSON}>Person</option>
                          <option value={TAG_TYPES.ORGANIZATION}>Organization</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Public</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Public tags are visible to everyone.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </DialogContent>
              <div className="px-6 py-4 flex justify-end space-x-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Tag"}
                </Button>
              </div>
            </form>
          </Form>
        </Dialog>

        {isLoading ? (
          <p>Loading tags...</p>
        ) : tags && tags.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableCaption>A list of your tags.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Public</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">{tag.name}</TableCell>
                    <TableCell>{tag.description}</TableCell>
                    <TableCell>{tag.type}</TableCell>
                    <TableCell>{tag.is_public ? "Yes" : "No"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p>No tags found.</p>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminTags;
