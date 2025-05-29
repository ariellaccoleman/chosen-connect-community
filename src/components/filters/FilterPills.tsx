
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterPill {
  id: string;
  label: string;
  onRemove: () => void;
}

interface FilterPillsProps {
  filters: FilterPill[];
  className?: string;
}

const FilterPills = ({ filters, className }: FilterPillsProps) => {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <span className="text-sm text-gray-500 font-medium">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="flex items-center gap-1 px-3 py-1"
        >
          <span>{filter.label}</span>
          <button
            onClick={filter.onRemove}
            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X size={12} />
          </button>
        </Badge>
      ))}
    </div>
  );
};

export default FilterPills;
