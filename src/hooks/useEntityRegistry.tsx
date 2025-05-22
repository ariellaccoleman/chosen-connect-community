
// This file is a compatibility layer that forwards to useEntitySystem
import { useEntitySystem } from './useEntitySystem';

// Re-export the hook with the old name for backward compatibility
export const useEntityRegistry = useEntitySystem;

// Default export for backward compatibility
export default useEntitySystem;
