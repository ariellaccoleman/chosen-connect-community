
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

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
      country, 
      minPopulation = 15000, 
      globalImport = false,
      // New pagination parameters
      batchSize = 1000,    // How many records to fetch per API call
      startRow = 0,        // Starting row for pagination
      maxBatches = 5,      // Maximum number of batches to process in one request
      continueToken = null // Token for continuing a previous import
    } = requestData;
    
    if (!country && !globalImport) {
      console.error('Missing country parameter or globalImport flag');
      return new Response(JSON.stringify({
        error: 'Either country parameter or globalImport flag is required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    
    // Fetch cities from GeoNames API
    const geoNamesUsername = Deno.env.get('GEONAMES_USERNAME');
    if (!geoNamesUsername) {
      console.error('Missing GeoNames username');
      return new Response(JSON.stringify({
        error: 'GeoNames username is not configured'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    
    // Initialize import statistics
    let totalInsertedCount = 0;
    let totalUpdatedCount = 0;
    let totalSkippedCount = 0;
    let nextStartRow = startRow;
    let hasMoreData = true;
    let importStatus = [];
    let currentBatch = 0;
    
    // Process continuation token if provided
    let continuationState = null;
    if (continueToken) {
      try {
        continuationState = JSON.parse(atob(continueToken));
        nextStartRow = continuationState.nextStartRow;
        totalInsertedCount = continuationState.totalInsertedCount || 0;
        totalUpdatedCount = continuationState.totalUpdatedCount || 0;
        totalSkippedCount = continuationState.totalSkippedCount || 0;
        console.log(`Resuming import from row ${nextStartRow} with previous counts:`, {
          inserted: totalInsertedCount,
          updated: totalUpdatedCount,
          skipped: totalSkippedCount
        });
      } catch (e) {
        console.error('Invalid continuation token:', e);
        return new Response(JSON.stringify({
          error: 'Invalid continuation token'
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 400
        });
      }
    }
    
    // Process batches until maxBatches is reached or no more data
    while (hasMoreData && currentBatch < maxBatches) {
      const currentStartRow = nextStartRow;
      console.log(`Processing batch ${currentBatch + 1}/${maxBatches}, starting from row ${currentStartRow}`);
      
      // Build the GeoNames API URL with pagination parameters
      let geoNamesUrl;
      if (globalImport) {
        console.log(`Fetching global cities batch with startRow=${currentStartRow}, batchSize=${batchSize}, minPopulation=${minPopulation}`);
        geoNamesUrl = `http://api.geonames.org/searchJSON?cities=cities1000&maxRows=${batchSize}&startRow=${currentStartRow}&username=${geoNamesUsername}&orderby=population&style=full`;
      } else {
        console.log(`Fetching cities for country: ${country}, startRow=${currentStartRow}, batchSize=${batchSize}, minPopulation=${minPopulation}`);
        geoNamesUrl = `http://api.geonames.org/searchJSON?country=${country}&cities=cities1000&maxRows=${batchSize}&startRow=${currentStartRow}&username=${geoNamesUsername}&orderby=population&style=full`;
      }
      
      console.log(`Calling GeoNames API: ${geoNamesUrl}`);
      
      // Fetch the current batch
      const response = await fetch(geoNamesUrl);
      const data = await response.json();
      
      if (!response.ok) {
        console.error('GeoNames API returned an error', data);
        return new Response(JSON.stringify({
          error: 'GeoNames API returned an error',
          details: data,
          importStatus
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 502
        });
      }
      
      if (!data.geonames) {
        console.error('Invalid response from GeoNames API', data);
        return new Response(JSON.stringify({
          error: 'Failed to fetch data from GeoNames',
          details: data,
          importStatus
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 500
        });
      }
      
      console.log(`Found ${data.geonames.length} cities in batch ${currentBatch + 1}`);
      
      // If no data returned, we've reached the end
      if (data.geonames.length === 0) {
        console.log(`No more data available after row ${currentStartRow}`);
        hasMoreData = false;
        break;
      }
      
      // Filter cities by population
      const cities = data.geonames.filter((city) => city.population >= minPopulation);
      console.log(`Filtered to ${cities.length} cities with population >= ${minPopulation}`);
      
      // Prepare data for batch insert
      const locationsToInsert = cities.map((city) => ({
        city: city.name || '',
        region: city.adminName1 || '',
        country: city.countryName || '',
        geoname_id: city.geonameId || null,
        latitude: city.lat || null,
        longitude: city.lng || null,
        admin_code1: city.adminCode1 || null,
        admin_code2: city.adminCode2 || null,
        admin_name2: city.adminName2 || null,
        timezone: city.timezone?.timeZoneId || null
      }));
      
      if (locationsToInsert.length > 0) {
        // Insert into the locations table
        try {
          const batchInsertSize = 100; // Smaller batches for database operations
          let batchInsertedCount = 0;
          let batchUpdatedCount = 0;
          let batchSkippedCount = 0;
          
          // Process locations in small batches for the database
          for (let i = 0; i < locationsToInsert.length; i += batchInsertSize) {
            const dbBatch = locationsToInsert.slice(i, i + batchInsertSize);
            console.log(`Processing database insert batch ${Math.floor(i / batchInsertSize) + 1} of ${Math.ceil(locationsToInsert.length / batchInsertSize)}`);
            
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
                batchSkippedCount += batchWithGeonameIds.length;
              } else if (insertResultGeoname) {
                batchInsertedCount += insertResultGeoname.length;
                batchUpdatedCount += (batchWithGeonameIds.length - insertResultGeoname.length);
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
                batchSkippedCount += batchWithoutGeonameIds.length;
              } else if (insertResultFallback) {
                batchInsertedCount += insertResultFallback.length;
                batchUpdatedCount += (batchWithoutGeonameIds.length - insertResultFallback.length);
              }
            }
          }
          
          // Update totals
          totalInsertedCount += batchInsertedCount;
          totalUpdatedCount += batchUpdatedCount;
          totalSkippedCount += batchSkippedCount;
          
          // Add batch status to the import status
          importStatus.push({
            batch: currentBatch + 1,
            startRow: currentStartRow,
            processed: locationsToInsert.length,
            inserted: batchInsertedCount,
            updated: batchUpdatedCount,
            skipped: batchSkippedCount
          });
          
          console.log(`Batch ${currentBatch + 1} complete: ${batchInsertedCount} inserted, ${batchUpdatedCount} updated, ${batchSkippedCount} skipped`);
          
        } catch (insertError) {
          console.error('Exception during database insert:', insertError);
          
          // Generate continuation token for resuming
          const continuationToken = btoa(JSON.stringify({
            nextStartRow: currentStartRow + batchSize,
            totalInsertedCount,
            totalUpdatedCount,
            totalSkippedCount
          }));
          
          return new Response(JSON.stringify({
            error: 'Exception during database insert',
            details: insertError.message,
            importStatus,
            continuationToken,
            progress: {
              inserted: totalInsertedCount,
              updated: totalUpdatedCount,
              skipped: totalSkippedCount,
              total: totalInsertedCount + totalUpdatedCount + totalSkippedCount,
              nextStartRow: currentStartRow + batchSize
            }
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 500
          });
        }
      }
      
      // Move to next batch
      nextStartRow = currentStartRow + batchSize;
      currentBatch++;
      
      // Check if we've processed the maximum number of cities from GeoNames
      // For large batches of data, the logic will need to limit how many records are processed in one function call 
      if (data.geonames.length < batchSize) {
        console.log(`Received fewer records (${data.geonames.length}) than requested (${batchSize}), reached end of data`);
        hasMoreData = false;
      }
    }
    
    // Generate continuation token if there's more data
    let continuationToken = null;
    if (hasMoreData) {
      continuationToken = btoa(JSON.stringify({
        nextStartRow,
        totalInsertedCount,
        totalUpdatedCount,
        totalSkippedCount
      }));
    }
    
    const source = globalImport ? 'globally' : `for ${country}`;
    return new Response(JSON.stringify({
      success: true,
      message: `Successfully imported cities from GeoNames ${source}`,
      count: totalInsertedCount,
      updated: totalUpdatedCount,
      skipped: totalSkippedCount,
      total: totalInsertedCount + totalUpdatedCount + totalSkippedCount,
      hasMoreData,
      nextStartRow: hasMoreData ? nextStartRow : null,
      continuationToken: hasMoreData ? continuationToken : null,
      importStatus
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error in import-geonames function:', error);
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
