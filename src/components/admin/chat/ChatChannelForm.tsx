
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormWrapper } from '@/components/common/form/FormWrapper';
import { Textarea } from '@/components/ui/textarea';
import { ChatChannelCreate, ChatChannelType } from '@/types/chat';
import { EntityType } from '@/types/entityTypes';
import { logger } from '@/utils/logger';
import { useSelectionTags } from '@/hooks/tags';
import { Tag } from '@/utils/tags/types';

const channelFormSchema = z.object({
  name: z.string().min(3, 'Channel name must be at least 3 characters'),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
  channel_type: z.enum(['group', 'announcement']).default('group'),
});

type ChatChannelFormValues = z.infer<typeof channelFormSchema>;

interface ChatChannelFormProps {
  onSubmit: (data: ChatChannelCreate) => void; 
  isSubmitting?: boolean;
  defaultValues?: Partial<ChatChannelFormValues>;
  isEditMode?: boolean;
  existingChannelId?: string;
  initialTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
}

export default function ChatChannelForm({
  onSubmit,
  isSubmitting = false,
  defaultValues,
  isEditMode = false,
  existingChannelId,
  initialTagIds = [],
  onTagsChange
}: ChatChannelFormProps) {
  // Get available tags for chat entities
  const { data: tagsResponse } = useSelectionTags(EntityType.CHAT);
  const availableTags = tagsResponse?.data || [];
  
  // Track selected tags
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds);
  
  useEffect(() => {
    if (initialTagIds?.length > 0) {
      setSelectedTags(initialTagIds);
    }
  }, [initialTagIds]);
  
  // Log the default values to check they are correctly passed
  logger.info('ChatChannelForm defaultValues:', defaultValues);
  
  const form = useForm<ChatChannelFormValues>({
    resolver: zodResolver(channelFormSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      is_public: defaultValues?.is_public === false ? false : true,
      channel_type: defaultValues?.channel_type || 'group'
    },
  });
  
  // Handle tag selection change
  const handleTagToggle = (tagId: string) => {
    setSelectedTags(prev => {
      const newSelection = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
        
      // Notify parent component about tag changes
      if (onTagsChange) {
        onTagsChange(newSelection);
      }
      
      return newSelection;
    });
  };
  
  const handleSubmitForm = (values: ChatChannelFormValues) => {
    onSubmit({
      name: values.name,
      description: values.description,
      is_public: values.is_public,
      channel_type: values.channel_type as ChatChannelType
    });
  };
  
  return (
    <FormWrapper form={form} onSubmit={handleSubmitForm}>
      <FormField
        name="name"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Channel Name</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Enter channel name" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="description"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                {...field} 
                placeholder="Enter channel description" 
                rows={3} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="channel_type"
        control={form.control}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Channel Type</FormLabel>
            <Select 
              onValueChange={field.onChange} 
              defaultValue={field.value}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select channel type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <FormField
        name="is_public"
        control={form.control}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0">
            <FormLabel>Public Channel</FormLabel>
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
      
      {existingChannelId && (
        <div className="space-y-2">
          <FormLabel>Channel Tags</FormLabel>
          <div className="border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-gray-50 dark:bg-gray-800">
            {availableTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag: Tag) => (
                  <div 
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full cursor-pointer transition-colors ${
                      selectedTags.includes(tag.id) 
                        ? 'bg-primary text-white' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {tag.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags available for chat channels</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Click on tags to select or deselect them
            </p>
          </div>
        </div>
      )}
      
      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isEditMode ? 'Update Channel' : 'Create Channel'}
        </Button>
      </div>
    </FormWrapper>
  );
}
