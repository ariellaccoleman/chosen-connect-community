import { useState } from "react";

/**
 * Function to invalidate server-side tag cache
 * Exported here for better organization
 */
export const invalidateTagCache = async (entityType?: "person" | "organization") => {
  try {
    // If an entity type is specified, only invalidate that cache
    if (entityType) {
      await fetch(`/api/tags/invalidate-cache?entityType=${entityType}`, { 
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
