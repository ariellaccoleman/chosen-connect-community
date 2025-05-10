
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { decompress } from 'https://deno.land/x/zip@v1.2.3/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  
  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing Authorization header');
      return new Response(JSON.stringify({
        error: 'Authorization header is required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 401
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      return new Response(JSON.stringify({
        error: 'Supabase credentials are not configured properly'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse the request body
    const requestData = await req.json();
    const { 
      minPopulation = 15000, 
      batchSize = 1000,
      country = null,
      offset = 0,
      limit = 5000
    } = requestData;
    
    console.log('Processing local geonames file with params:', {
      minPopulation,
      batchSize,
      country,
      offset,
      limit
    });
    
    // Initialize import statistics
    let totalInsertedCount = 0;
    let totalUpdatedCount = 0;
    let totalSkippedCount = 0;
    let hasMoreData = false;
    let importStatus = [];
    
    try {
      // Get the cities1000.zip file from the public directory
      const zipFileBytes = await Deno.readFile('./location-data/cities1000.zip');
      console.log(`Read ${zipFileBytes.length} bytes from cities1000.zip`);
      
      // Decompress the zip file
      const decompressedFiles = await decompress(zipFileBytes);
      console.log(`Decompressed ${Object.keys(decompressedFiles).length} files from zip`);
      
      if (!decompressedFiles['cities1000.txt']) {
        throw new Error('cities1000.txt not found in the zip file');
      }
      
      const citiesText = new TextDecoder().decode(decompressedFiles['cities1000.txt']);
      const lines = citiesText.split('\n');
      console.log(`Total lines in cities1000.txt: ${lines.length}`);
      
      // Apply offset and limit
      const maxIndex = Math.min(offset + limit, lines.length);
      console.log(`Processing lines from ${offset} to ${maxIndex}`);
      
      // Check if there are more data beyond this batch
      hasMoreData = maxIndex < lines.length;
      
      // Process the lines in batches
      const locationsToProcess = [];
      
      for (let i = offset; i < maxIndex; i++) {
        const line = lines[i];
        if (!line.trim()) continue; // Skip empty lines
        
        // Parse the tab-delimited line
        // Format: geonameid, name, asciiname, alternatenames, latitude, longitude, feature class, feature code, country code, cc2, admin1 code, admin2 code, admin3 code, admin4 code, population, elevation, dem, timezone, modification date
        const fields = line.split('\t');
        
        if (fields.length < 19) {
          console.warn(`Line ${i} has invalid format (${fields.length} fields)`);
          continue;
        }
        
        const geonameId = parseInt(fields[0], 10);
        const name = fields[1];
        const latitude = parseFloat(fields[4]);
        const longitude = parseFloat(fields[5]);
        const countryCode = fields[8];
        const admin1Code = fields[10]; // admin1 code
        const admin2Code = fields[11]; // admin2 code
        const population = parseInt(fields[14], 10);
        const timezone = fields[17];
        
        // Skip locations with population less than minimum
        if (population < minPopulation) {
          continue;
        }
        
        // Skip if country filter is applied and doesn't match
        if (country && countryCode !== country) {
          continue;
        }
        
        // Get country and region names from country code and admin codes
        // Note: In a real implementation, you'd want to map these codes to actual names
        // For now, we'll use the codes as is
        
        // Simplistic country name mapping for common countries
        const countryNames: Record<string, string> = {
          'US': 'United States',
          'GB': 'United Kingdom',
          'CA': 'Canada',
          'AU': 'Australia',
          'DE': 'Germany',
          'FR': 'France',
          'ES': 'Spain',
          'IT': 'Italy',
          'JP': 'Japan',
          'CN': 'China',
          'IN': 'India',
          'BR': 'Brazil',
          // Add more as needed
        };
        
        const countryName = countryNames[countryCode] || countryCode;
        // For region, we'll just use the admin1 code for now
        const region = admin1Code || '';
        
        // Add the location to the batch
        locationsToProcess.push({
          city: name,
          region: region,
          country: countryName,
          geoname_id: geonameId,
          latitude: latitude,
          longitude: longitude,
          admin_code1: admin1Code,
          admin_code2: admin2Code,
          timezone: timezone
        });
        
        // Process in database batches when we reach batchSize
        if (locationsToProcess.length >= batchSize) {
          const result = await processLocationBatch(supabase, locationsToProcess);
          totalInsertedCount += result.inserted;
          totalUpdatedCount += result.updated;
          totalSkippedCount += result.skipped;
          
          importStatus.push({
            batch: importStatus.length + 1,
            startRow: offset + importStatus.length * batchSize,
            processed: locationsToProcess.length,
            inserted: result.inserted,
            updated: result.updated,
            skipped: result.skipped
          });
          
          // Clear the batch
          locationsToProcess.length = 0;
        }
      }
      
      // Process any remaining locations
      if (locationsToProcess.length > 0) {
        const result = await processLocationBatch(supabase, locationsToProcess);
        totalInsertedCount += result.inserted;
        totalUpdatedCount += result.updated;
        totalSkippedCount += result.skipped;
        
        importStatus.push({
          batch: importStatus.length + 1,
          startRow: offset + importStatus.length * batchSize,
          processed: locationsToProcess.length,
          inserted: result.inserted,
          updated: result.updated,
          skipped: result.skipped
        });
      }
      
      // Generate continuation token if there's more data
      const continuationToken = hasMoreData ? btoa(JSON.stringify({
        nextOffset: maxIndex,
        country,
        minPopulation
      })) : null;
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully imported locations from file',
        count: totalInsertedCount,
        updated: totalUpdatedCount,
        skipped: totalSkippedCount,
        total: totalInsertedCount + totalUpdatedCount + totalSkippedCount,
        hasMoreData,
        nextOffset: hasMoreData ? maxIndex : null,
        continuationToken,
        importStatus
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
      
    } catch (fileError) {
      console.error('Error processing file:', fileError);
      return new Response(JSON.stringify({
        error: 'Failed to process file',
        details: fileError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    
  } catch (error) {
    console.error('Error in import-local-geonames function:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
});

// Helper function to process a batch of locations
async function processLocationBatch(supabase, locations) {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  
  try {
    // Process in smaller batches for the database
    const dbBatchSize = 100;
    
    for (let i = 0; i < locations.length; i += dbBatchSize) {
      const dbBatch = locations.slice(i, i + dbBatchSize);
      console.log(`Processing database batch ${Math.floor(i / dbBatchSize) + 1} of ${Math.ceil(locations.length / dbBatchSize)}`);
      
      // Primary strategy: Use geoname_id for conflict resolution if available
      const batchWithGeonameIds = dbBatch.filter(location => location.geoname_id !== null);
      if (batchWithGeonameIds.length > 0) {
        const { data: insertResultGeoname, error: insertErrorGeoname } = await supabase
          .from('locations')
          .upsert(batchWithGeonameIds, { 
            onConflict: 'geoname_id',
            ignoreDuplicates: false // Update existing records
          })
          .select();
        
        if (insertErrorGeoname) {
          console.error('Error upserting locations with geoname_id:', insertErrorGeoname);
          skippedCount += batchWithGeonameIds.length;
        } else if (insertResultGeoname) {
          insertedCount += insertResultGeoname.length;
          updatedCount += (batchWithGeonameIds.length - insertResultGeoname.length);
        }
      }
      
      // Fallback strategy: For entries without geoname_id, use city/region/country
      const batchWithoutGeonameIds = dbBatch.filter(location => location.geoname_id === null);
      if (batchWithoutGeonameIds.length > 0) {
        const { data: insertResultFallback, error: insertErrorFallback } = await supabase
          .from('locations')
          .upsert(batchWithoutGeonameIds, { 
            onConflict: 'city,region,country', 
            ignoreDuplicates: false // Update existing records
          })
          .select();
        
        if (insertErrorFallback) {
          console.error('Error upserting locations without geoname_id:', insertErrorFallback);
          skippedCount += batchWithoutGeonameIds.length;
        } else if (insertResultFallback) {
          insertedCount += insertResultFallback.length;
          updatedCount += (batchWithoutGeonameIds.length - insertResultFallback.length);
        }
      }
    }
    
    return {
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount
    };
    
  } catch (error) {
    console.error('Error in processLocationBatch:', error);
    skippedCount += locations.length;
    return {
      inserted: insertedCount,
      updated: updatedCount,
      skipped: skippedCount
    };
  }
}
