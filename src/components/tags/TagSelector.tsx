
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { Check, Plus, Tag as TagIcon } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { TAG_TYPES, fetchTags, createTag, getTagEntityTypes } from "@/utils/tagUtils";
import type { Tag } from "@/utils/tagUtils";

interface TagSelectorProps {
  targetType: "person" | "organization";
  onTagSelected: (tag: Tag) => void;
  isAdmin?: boolean;
}

const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).nullable().optional(),
  is_public: z.boolean().default(false),
});

type CreateTagFormValues = z.infer<typeof createTagSchema>;

const TagSelector = ({ targetType, onTagSelected, isAdmin = false }: TagSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();

  const form = useForm<CreateTagFormValues>({
    resolver: zodResolver(createTagSchema),
    defaultValues: {
      name: "",
      description: "",
      is_public: false,
    },
  });

  // Load tags based on search criteria
  useEffect(() => {
    const loadTags = async () => {
      const fetchedTags = await fetchTags({ 
        // We no longer filter by type, to show tags from all entity types
        searchQuery: searchValue,
        // Don't filter by target type to show all available tags
      });
      setTags(fetchedTags);
    };

    // Add a small delay to avoid too many requests while typing
    const timeoutId = setTimeout(loadTags, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue, isAdmin, user?.id]);

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
        setIsCreateDialogOpen(false);
        onTagSelected(newTag);
      } else {
        toast.error("Failed to create tag");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag. Please try again.");
    }
  };

  // Handle selecting an existing tag
  const handleSelectTag = (tag: Tag) => {
    onTagSelected(tag);
    setSearchValue("");
    setOpen(false);
  };

  // Open the create tag dialog and populate with current search term
  const handleOpenCreateDialog = () => {
    if (!user?.id) {
      toast.error("You must be logged in to create tags");
      return;
    }
    
    form.setValue("name", searchValue);
    setIsCreateDialogOpen(true);
    setOpen(false);
  };

  // Function to check if a tag is used with a different entity type
  const isFromDifferentEntityType = async (tag: Tag): Promise<boolean> => {
    const entityTypes = await getTagEntityTypes(tag.id);
    if (!entityTypes || entityTypes.length === 0) {
      return false;
    }
    return !entityTypes.includes(targetType);
  };

  // Function to format entity types for display
  const formatEntityTypes = async (tag: Tag): Promise<string | null> => {
    const entityTypes = await getTagEntityTypes(tag.id);
    if (!entityTypes || entityTypes.length === 0 || entityTypes.includes(targetType)) {
      return null;
    }
    
    return entityTypes
      .map(type => type === "person" ? "People" : "Organizations")
      .join(", ");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <TagIcon className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Select or create a tag</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px]">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground">No tags found</p>
                  {user && (
                    <Button
                      variant="outline"
                      className="mt-2"
                      size="sm"
                      onClick={handleOpenCreateDialog}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create "{searchValue}"
                    </Button>
                  )}
                  {!user && (
                    <p className="text-muted-foreground mt-2">
                      Please log in to create tags
                    </p>
                  )}
                </div>
              </CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => {
                  // We need to use state for entity type info
                  const [entityTypeInfo, setEntityTypeInfo] = useState<string | null>(null);
                  const [isDifferentType, setIsDifferentType] = useState(false);
                  
                  // Get entity type info when tag is rendered
                  useEffect(() => {
                    const getInfo = async () => {
                      const isDifferent = await isFromDifferentEntityType(tag);
                      setIsDifferentType(isDifferent);
                      
                      if (isDifferent) {
                        const typeInfo = await formatEntityTypes(tag);
                        setEntityTypeInfo(typeInfo);
                      }
                    };
                    
                    getInfo();
                  }, [tag.id]);
                  
                  return (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleSelectTag(tag)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center">
                          <span>{tag.name}</span>
                          {isDifferentType && entityTypeInfo && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({entityTypeInfo})
                            </span>
                          )}
                        </div>
                        
                        {tag.description && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {tag.description}
                          </span>
                        )}
                      </div>
                      {tag.is_public && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          Public
                        </span>
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              {searchValue && user && (
                <div className="p-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleOpenCreateDialog}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create new tag
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Tag</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TagSelector;
