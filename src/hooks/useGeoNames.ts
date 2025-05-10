
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
  forceContinue?: boolean;
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

  // Function to import from the GeoNames API
  const importLocations = async ({ 
    country, 
    maxResults = 1000, 
    minPopulation = 15000,
    globalImport = false,
    batchSize = 1000,
    startRow = 0,
    maxBatches = 5,
    continueToken = null,
    forceContinue = false
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
        continueToken,
        forceContinue
      });
      
      const { data, error } = await supabase.functions.invoke('import-geonames', {
        body: {
          country,
          minPopulation,
          globalImport,
          batchSize,
          startRow,
          maxBatches,
          continueToken,
          forceContinue
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
  
  // Function to import from local cities1000.zip file
  const importLocationsFromFile = async ({
    minPopulation = 15000,
    batchSize = 1000,
    country = null,
    offset = 0,
    limit = 5000
  }: {
    minPopulation?: number;
    batchSize?: number;
    country?: string | null;
    offset?: number;
    limit?: number;
  }): Promise<ImportResult> => {
    setIsImporting(true);
    
    try {
      console.log('Importing locations from local file with params:', { 
        minPopulation,
        batchSize,
        country,
        offset,
        limit
      });
      
      const { data, error } = await supabase.functions.invoke('import-local-geonames', {
        body: {
          minPopulation,
          batchSize,
          country,
          offset,
          limit
        }
      });
      
      if (error) {
        console.error('Error importing locations from file:', error);
        toast.error(`Failed to import locations from file: ${error.message || 'Unknown error'}`);
        return { success: false, error };
      }
      
      if (!data || (!data.count && data.count !== 0)) {
        const source = country ? `for ${country}` : 'from file';
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
        nextStartRow: data.nextOffset || null,
        continuationToken: data.continuationToken || null
      });
      
      // Enhanced success message with more details
      let successMessage = `Successfully imported ${data.count} locations from file`;
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
      console.error('Exception importing locations from file:', error);
      toast.error(`An unexpected error occurred: ${error.message || 'Unknown error'}`);
      return { success: false, error };
    } finally {
      setIsImporting(false);
    }
  };
  
  const continueImport = async (forceContinue = false): Promise<ImportResult | null> => {
    if (!importProgress || (!importProgress.hasMoreData && !forceContinue) || !importProgress.continuationToken) {
      toast.error('No import to continue or continuation not possible');
      return null;
    }
    
    return importLocations({
      continueToken: importProgress.continuationToken,
      globalImport: true, // The continuation token contains all necessary state
      forceContinue
    });
  };

  const resetImportProgress = () => {
    setImportProgress(null);
  };

  return {
    importLocations,
    importLocationsFromFile,
    continueImport,
    resetImportProgress,
    isImporting,
    importProgress
  };
};
