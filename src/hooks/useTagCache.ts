
import { useState } from "react";
import { EntityType } from "@/types/entityTypes";

/**
 * Function to invalidate server-side tag cache
 * Exported here for better organization
 */
export const invalidateTagCache = async (entityType?: EntityType) => {
  try {
    // If an entity type is specified, only invalidate that cache
    if (entityType) {
      const entityTypeParam = entityType.toString();
      await fetch(`/api/tags/invalidate-cache?entityType=${entityTypeParam}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      // Otherwise invalidate all tag caches
      await fetch('/api/tags/invalidate-cache', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("Failed to invalidate tag cache:", error);
  }
};
