
import React, { useState, useEffect } from "react";
import { CommandItem } from "@/components/ui/command";
import { Tag, getTagEntityTypes } from "@/utils/tags";

interface TagCommandItemProps {
  tag: Tag;
  onSelect: () => void;
  targetType: "person" | "organization";
}

const TagCommandItem = ({ tag, onSelect, targetType }: TagCommandItemProps) => {
  const [entityTypeInfo, setEntityTypeInfo] = useState<string | null>(null);
  const [isDifferentType, setIsDifferentType] = useState(false);
  
  // Get entity type info when tag is rendered
  useEffect(() => {
    const getInfo = async () => {
      const entityTypes = await getTagEntityTypes(tag.id);
      const isDifferent = !entityTypes.includes(targetType) && entityTypes.length > 0;
      setIsDifferentType(isDifferent);
      
      if (isDifferent) {
        const typeInfo = entityTypes
          .map(type => type === "person" ? "People" : "Organizations")
          .join(", ");
        setEntityTypeInfo(typeInfo);
      }
    };
    
    getInfo();
  }, [tag.id, targetType]);
  
  return (
    <CommandItem
      value={tag.name}
      onSelect={onSelect}
      className="flex items-center justify-between"
    >
      <div className="flex flex-col">
        <div className="flex items-center">
          <span>{tag.name}</span>
          {/* Show entity type in typeaheads for tags from a different entity type */}
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
};

export default TagCommandItem;
