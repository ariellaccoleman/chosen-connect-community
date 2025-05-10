
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ImportGeoNamesParams {
  country?: string;
  maxResults?: number;
  minPopulation?: number;
  globalImport?: boolean;
  batchSize?: number;
  startRow?: number;
  maxBatches?: number;
  continueToken?: string | null;
}

interface ImportResult {
  success: boolean;
  count?: number;
  updated?: number;
  total?: number;
  skipped?: number;
  hasMoreData?: boolean;
  nextStartRow?: number | null;
  continuationToken?: string | null;
  importStatus?: Array<{
    batch: number;
    startRow: number;
    processed: number;
    inserted: number;
    updated: number;
    skipped: number;
  }>;
  error?: any;
  data?: any;
}

export const useGeoNames = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    inserted: number;
    updated: number;
    skipped: number;
    total: number;
    hasMoreData: boolean;
    nextStartRow: number | null;
    continuationToken: string | null;
  } | null>(null);

  const importLocations = async ({ 
    country, 
    maxResults = 1000, 
    minPopulation = 15000,
    globalImport = false,
    batchSize = 1000,
    startRow = 0,
    maxBatches = 5,
    continueToken = null
  }: ImportGeoNamesParams): Promise<ImportResult> => {
    setIsImporting(true);
    
    try {
      if (!globalImport && !country) {
        toast.error('Either country or globalImport parameter must be provided');
        return { success: false, error: 'Missing parameters' };
      }
      
      console.log('Calling import-geonames function with params:', { 
        country, 
        minPopulation,
        globalImport,
        batchSize,
        startRow,
        maxBatches,
        continueToken
      });
      
      const { data, error } = await supabase.functions.invoke('import-geonames', {
        body: {
          country,
          minPopulation,
          globalImport,
          batchSize,
          startRow,
          maxBatches,
          continueToken
        }
      });
      
      if (error) {
        console.error('Error importing locations:', error);
        
        // Provide more specific error messages based on the error type
        if (error.message?.includes('JWT')) {
          toast.error('Authentication error. Please sign in again.');
        } else if (error.message?.includes('network')) {
          toast.error('Network error. Please check your internet connection.');
        } else {
          toast.error(`Failed to import locations: ${error.message || 'Unknown error'}`);
        }
        
        return { success: false, error };
      }
      
      if (!data || (!data.count && data.count !== 0)) {
        const source = globalImport ? 'globally' : `for ${country}`;
        toast.info(`No locations found ${source} with population >= ${minPopulation}`);
        return { success: true, data: { count: 0 } };
      }
      
      // Update progress state
      setImportProgress({
        inserted: data.count || 0,
        updated: data.updated || 0,
        skipped: data.skipped || 0,
        total: data.total || 0,
        hasMoreData: data.hasMoreData || false,
        nextStartRow: data.nextStartRow || null,
        continuationToken: data.continuationToken || null
      });
      
      // Enhanced success message with more details
      let successMessage = `Successfully imported ${data.count} locations`;
      if (data.updated && data.updated > 0) {
        successMessage += `, updated ${data.updated} existing records`;
      }
      if (data.skipped && data.skipped > 0) {
        successMessage += ` (${data.skipped} skipped)`;
      }
      
      if (data.hasMoreData) {
        successMessage += '. More data available.';
      }
      
      toast.success(successMessage);
      return { 
        success: true, 
        ...data 
      };
    } catch (error) {
      console.error('Exception importing locations:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
      return { success: false, error };
    } finally {
      setIsImporting(false);
    }
  };
  
  const continueImport = async (): Promise<ImportResult | null> => {
    if (!importProgress || !importProgress.hasMoreData || !importProgress.continuationToken) {
      toast.error('No import to continue');
      return null;
    }
    
    return importLocations({
      continueToken: importProgress.continuationToken,
      globalImport: true // The continuation token contains all necessary state
    });
  };

  const resetImportProgress = () => {
    setImportProgress(null);
  };

  return {
    importLocations,
    continueImport,
    resetImportProgress,
    isImporting,
    importProgress
  };
};
