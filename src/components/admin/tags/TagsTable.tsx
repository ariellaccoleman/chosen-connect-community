
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tag } from "@/utils/tags";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home, Edit, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TagsTableProps {
  tags: Tag[];
  isLoading: boolean;
  onMakeHub?: (tagId: string) => Promise<void>;
  onRemoveHub?: (tagId: string) => Promise<void>;
  onEditTag?: (tag: Tag) => void;
  onDeleteTag?: (tagId: string) => Promise<void>;
  hubTagIds?: string[];
  isProcessing?: { [key: string]: boolean };
  isDeletingTag?: { [key: string]: boolean };
}

const TagsTable = ({ 
  tags, 
  isLoading, 
  onMakeHub, 
  onRemoveHub,
  onEditTag,
  onDeleteTag,
  hubTagIds = [],
  isProcessing = {},
  isDeletingTag = {}
}: TagsTableProps) => {
  if (isLoading) {
    return <p>Loading tags...</p>;
  }

  if (!tags || tags.length === 0) {
    return <p>No tags found.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A list of your tags.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => {
            const isHub = hubTagIds.includes(tag.id);
            const isProcessingTag = isProcessing[tag.id];
            const isDeletingThisTag = isDeletingTag[tag.id];
            
            return (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">
                  {tag.name}
                  {isHub && (
                    <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">Hub</Badge>
                  )}
                </TableCell>
                <TableCell>{tag.description}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {onEditTag && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onEditTag(tag)}
                        disabled={isProcessingTag || isDeletingThisTag}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    
                    {onDeleteTag && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={isProcessingTag || isDeletingThisTag}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {isDeletingThisTag ? 'Deleting...' : 'Delete'}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{tag.name}"? This action cannot be undone and will remove all assignments of this tag.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => onDeleteTag(tag.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    
                    {onMakeHub && onRemoveHub && (
                      isHub ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isProcessingTag || isDeletingThisTag}
                          onClick={() => onRemoveHub(tag.id)}
                        >
                          <Home className="h-4 w-4 mr-2" />
                          {isProcessingTag ? 'Processing...' : 'Remove Hub'}
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          disabled={isProcessingTag || isDeletingThisTag}
                          onClick={() => onMakeHub(tag.id)}
                        >
                          <Home className="h-4 w-4 mr-2" />
                          {isProcessingTag ? 'Processing...' : 'Make Hub'}
                        </Button>
                      )
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TagsTable;
