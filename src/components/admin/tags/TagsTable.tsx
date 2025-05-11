
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

interface TagsTableProps {
  tags: Tag[];
  isLoading: boolean;
}

const TagsTable = ({ tags, isLoading }: TagsTableProps) => {
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
  );
};

export default TagsTable;
