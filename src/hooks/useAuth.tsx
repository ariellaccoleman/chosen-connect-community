
import { AuthProvider } from '@/providers/AuthProvider';
import { useAuth as useOriginalAuth } from '@/contexts/AuthContext';

// Re-export everything for backward compatibility
export { AuthProvider };
export const useAuth = useOriginalAuth;
