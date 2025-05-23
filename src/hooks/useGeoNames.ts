
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/logger';
import { handleError } from '@/utils/errorUtils';

interface ImportFileParams {
  debugMode?: boolean;
}

interface ImportResult {
  success: boolean;
  count?: number;
  updated?: number;
  total?: number;
  skipped?: number;
  error?: any;
  message?: string;
}

export const useGeoNames = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
    total: number;
  } | null>(null);
  
  const importLocationsFromFile = async ({
    debugMode = false
  }: ImportFileParams = {}): Promise<ImportResult> => {
    setIsImporting(true);
    logger.setDebugEnabled(debugMode);
    
    try {
      logger.info('Starting location import', { debugMode });
      
      const { data, error } = await supabase.functions.invoke('import-local-geonames', {
        body: { debugMode }
      });
      
      if (error) {
        handleError(error, 'Error importing locations from file');
        return { success: false, error };
      }
      
      if (!data) {
        logger.warn('No response data received when importing locations');
        toast.info('No response data received when importing locations');
        return { success: true, count: 0, total: 0 };
      }
      
      // Update progress state
      setImportProgress({
        inserted: data.count || 0,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
        total: data.total || 0
      });
      
      // Success message with details
      let successMessage = `Successfully imported ${data.count} locations`;
      if (data.updated && data.updated > 0) {
        successMessage += `, updated ${data.updated} existing records`;
      }
      if (data.skipped && data.skipped > 0) {
        successMessage += ` (${data.skipped} skipped)`;
      }
      
      logger.info('Import completed successfully', data);
      toast.success(successMessage);
      return { 
        success: true, 
        ...data 
      };
    } catch (error) {
      handleError(error, 'Exception importing locations from file');
      return { success: false, error };
    } finally {
      setIsImporting(false);
    }
  };
  
  const resetImportProgress = () => {
    setImportProgress(null);
  };

  return {
    importLocationsFromFile,
    resetImportProgress,
    isImporting,
    importProgress
  };
};
