
import React from "react";
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
import { Home, HomeX } from "lucide-react";

interface TagsTableProps {
  tags: Tag[];
  isLoading: boolean;
  onMakeHub?: (tagId: string) => Promise<void>;
  onRemoveHub?: (tagId: string) => Promise<void>;
  hubTagIds?: string[];
  isProcessing?: { [key: string]: boolean };
}

const TagsTable = ({ 
  tags, 
  isLoading, 
  onMakeHub, 
  onRemoveHub,
  hubTagIds = [],
  isProcessing = {}
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
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tags.map((tag) => {
            const isHub = hubTagIds.includes(tag.id);
            const isProcessingTag = isProcessing[tag.id];
            
            return (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">
                  {tag.name}
                  {isHub && (
                    <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">Hub</Badge>
                  )}
                </TableCell>
                <TableCell>{tag.description}</TableCell>
                <TableCell>{tag.type}</TableCell>
                <TableCell className="text-right">
                  {onMakeHub && onRemoveHub && (
                    isHub ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isProcessingTag}
                        onClick={() => onRemoveHub(tag.id)}
                      >
                        <HomeX className="h-4 w-4 mr-2" />
                        {isProcessingTag ? 'Processing...' : 'Remove Hub'}
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isProcessingTag}
                        onClick={() => onMakeHub(tag.id)}
                      >
                        <Home className="h-4 w-4 mr-2" />
                        {isProcessingTag ? 'Processing...' : 'Make Hub'}
                      </Button>
                    )
                  )}
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
