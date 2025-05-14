
import React, { useState, useEffect } from "react";
import { CommandItem } from "@/components/ui/command";
import { Tag, getTagEntityTypes } from "@/utils/tags";
import { EntityType } from "@/types/entityTypes";

interface TagCommandItemProps {
  tag: Tag;
  onSelect: () => void;
  targetType: EntityType;
}

const TagCommandItem = ({ tag, onSelect, targetType }: TagCommandItemProps) => {
  // Still keep the entity type logic since it might be needed elsewhere,
  // but we won't display the entity type information
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
          .map(type => type === EntityType.PERSON ? "People" : "Organizations")
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
          {/* Entity type display removed */}
        </div>
        
        {tag.description && (
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
            {tag.description}
          </span>
        )}
      </div>
    </CommandItem>
  );
};

export default TagCommandItem;
