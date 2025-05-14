
import { invalidateTagCache } from "@/utils/tags";
import { EntityType } from "@/types/entityTypes";

/**
 * API endpoint to invalidate the tag cache
 * This can be called from client-side code to clear server-side caches
 */
export const handleInvalidateCache = async (req: Request) => {
  const url = new URL(req.url);
  const entityTypeParam = url.searchParams.get('entityType');
  
  // Convert string to EntityType if provided
  const entityType = entityTypeParam ? (
    entityTypeParam === "person" ? EntityType.PERSON :
    entityTypeParam === "organization" ? EntityType.ORGANIZATION :
    entityTypeParam === "event" ? EntityType.EVENT : undefined
  ) : undefined;
  
  if (req.method === 'POST') {
    try {
      await invalidateTagCache(entityType);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error invalidating cache:', error);
      return new Response(JSON.stringify({ error: 'Failed to invalidate cache' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } else {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
