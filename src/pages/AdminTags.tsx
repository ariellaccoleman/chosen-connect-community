
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { useTags, useTagMutations } from "@/hooks/useTags";
import { TAG_TYPES, Tag } from "@/utils/tagUtils";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/select";
import { Plus, Edit, Trash, Check, X, Search } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  type: z.enum([TAG_TYPES.PERSON, TAG_TYPES.ORGANIZATION]),
  is_public: z.boolean().default(false),
});

type TagFormValues = z.infer<typeof tagSchema>;

const AdminTags = () => {
  const { user, isAdmin } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  
  const { data: tags = [], isLoading } = useTags({
    searchQuery,
    type: typeFilter,
  });
  
  const { createTag, updateTag, deleteTag, isCreating, isUpdating, isDeleting } = useTagMutations();
  
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      description: "",
      type: TAG_TYPES.PERSON,
      is_public: false,
    },
  });
  
  // If not admin, redirect to dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Open dialog for creating a new tag
  const handleCreateTag = () => {
    form.reset({
      name: "",
      description: "",
      type: TAG_TYPES.PERSON,
      is_public: false,
    });
    setEditingTag(null);
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing an existing tag
  const handleEditTag = (tag: Tag) => {
    form.reset({
      name: tag.name,
      description: tag.description || "",
      type: tag.type as any || TAG_TYPES.PERSON,
      is_public: tag.is_public,
    });
    setEditingTag(tag);
    setIsDialogOpen(true);
  };
  
  // Handle deleting a tag
  const handleDeleteTag = async (tag: Tag) => {
    if (confirm(`Are you sure you want to delete the tag "${tag.name}"? This cannot be undone.`)) {
      deleteTag(tag.id, {
        onSuccess: () => {
          toast.success(`Tag "${tag.name}" deleted successfully`);
        },
        onError: () => {
          toast.error(`Failed to delete tag "${tag.name}"`);
        }
      });
    }
  };
  
  // Handle form submission (create or update)
  const onSubmit = (data: TagFormValues) => {
    if (editingTag) {
      // Update existing tag
      updateTag({
        id: editingTag.id,
        updates: data
      }, {
        onSuccess: () => {
          toast.success(`Tag "${data.name}" updated successfully`);
          setIsDialogOpen(false);
        },
        onError: () => {
          toast.error(`Failed to update tag "${data.name}"`);
        }
      });
    } else {
      // Create new tag
      createTag(data, {
        onSuccess: () => {
          toast.success(`Tag "${data.name}" created successfully`);
          setIsDialogOpen(false);
        },
        onError: () => {
          toast.error(`Failed to create tag "${data.name}"`);
        }
      });
    }
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Tag Management</h1>
          <Button onClick={handleCreateTag}>
            <Plus className="mr-2 h-4 w-4" />
            Create Tag
          </Button>
        </div>
        
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined as any}>All types</SelectItem>
              <SelectItem value={TAG_TYPES.PERSON}>People</SelectItem>
              <SelectItem value={TAG_TYPES.ORGANIZATION}>Organizations</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Table>
          <TableCaption>List of all tags in the system</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">Loading tags...</TableCell>
              </TableRow>
            ) : tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">No tags found</TableCell>
              </TableRow>
            ) : (
              tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-medium">{tag.name}</TableCell>
                  <TableCell>{tag.type || "Unknown"}</TableCell>
                  <TableCell className="max-w-xs truncate">{tag.description || "—"}</TableCell>
                  <TableCell>
                    {tag.is_public ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <Check className="mr-1 h-3 w-3" />
                        Public
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                        <X className="mr-1 h-3 w-3" />
                        Private
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{tag.created_by ? "User" : "System"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditTag(tag)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleDeleteTag(tag)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTag ? "Edit Tag" : "Create Tag"}</DialogTitle>
            <DialogDescription>
              {editingTag 
                ? "Edit the details of this tag" 
                : "Create a new tag for people or organizations"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tag Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tag type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TAG_TYPES.PERSON}>Person</SelectItem>
                        <SelectItem value={TAG_TYPES.ORGANIZATION}>Organization</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? "Saving..." : (editingTag ? "Update" : "Create")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTags;
