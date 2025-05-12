
import { invalidateTagCache } from "@/utils/tags";

/**
 * API endpoint to invalidate the tag cache
 * This can be called from client-side code to clear server-side caches
 */
export const handleInvalidateCache = async (req: Request) => {
  const url = new URL(req.url);
  const entityType = url.searchParams.get('entityType') as "person" | "organization" | undefined;
  
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
