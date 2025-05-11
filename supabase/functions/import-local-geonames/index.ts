
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
      minPopulation = 15000, 
      batchSize = 1000,
      country = null,
      offset = 0,
      limit = 5000,
      debugMode = false
    } = requestData;
    
    console.log('Processing geonames with params:', {
      minPopulation,
      batchSize,
      country,
      offset,
      limit,
      debugMode
    });
    
    // Initialize import statistics
    let totalInsertedCount = 0;
    let totalUpdatedCount = 0;
    let totalSkippedCount = 0;
    let importStatus = [];
    
    try {
      // First load country info mapping
      const countryInfoMap = await loadCountryInfoMapping(supabase);
      
      // Load admin1 and admin2 code mappings
      const admin1CodeMap = await loadAdmin1CodeMapping(supabase);
      const admin2CodeMap = await loadAdmin2CodeMapping(supabase);
      
      console.log(`Loaded admin mappings: ${Object.keys(admin1CodeMap).length} admin1 codes, ${Object.keys(admin2CodeMap).length} admin2 codes`);
      
      if (debugMode) {
        // Log some sample entries to verify mappings
        const sampleAdmin1Keys = Object.keys(admin1CodeMap).slice(0, 5);
        console.log('Sample admin1 mappings:', sampleAdmin1Keys.map(key => ({
          key,
          name: admin1CodeMap[key]
        })));
        
        if (country) {
          console.log(`Admin1 mappings for ${country}:`, 
            Object.keys(admin1CodeMap)
              .filter(key => key.startsWith(country + '.'))
              .map(key => ({ key, name: admin1CodeMap[key] }))
          );
        }
      }
      
      // Get the cities text file directly
      console.log('Fetching cities1000.txt directly from storage');
      
      const { data: textData, error: textError } = await supabase
        .storage
        .from('location-data')
        .download('cities1000.txt');
      
      if (textError) {
        console.error('Error fetching text file from storage:', textError);
        return new Response(JSON.stringify({
          error: 'Failed to fetch text file from storage',
          details: textError.message
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 500
        });
      }
      
      // Convert text file to string
      const citiesText = new TextDecoder().decode(await textData.arrayBuffer());
      console.log(`Read ${citiesText.length} characters from cities1000.txt`);
      
      // Process the text content
      if (!citiesText) {
        throw new Error('Failed to get cities data from storage');
      }
      
      const lines = citiesText.split('\n');
      console.log(`Total lines in cities data: ${lines.length}`);
      
      // Apply offset and limit
      const maxIndex = Math.min(offset + limit, lines.length);
      console.log(`Processing lines from ${offset} to ${maxIndex}`);
      
      // Process the lines in batches
      const locationsToProcess = [];
      let filteredLocations = 0;
      
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
        
        filteredLocations++;
        
        // Get country name from our mapping
        const countryName = countryInfoMap[countryCode] || countryCode;
        
        // Create lookup keys for admin1 and admin2 names
        const admin1Key = `${countryCode}.${admin1Code}`;
        const admin2Key = `${countryCode}.${admin1Code}.${admin2Code}`;
        
        // Get admin names from our mappings
        const admin1Name = admin1CodeMap[admin1Key] || admin1Code;
        const admin2Name = admin2CodeMap[admin2Key] || null;
        
        // Create a full region path that includes admin1 and admin2 if available
        let fullRegionPath = admin1Name;
        if (admin2Name) {
          fullRegionPath = `${admin2Name}, ${fullRegionPath}`;
        }
        
        // Create a full location name
        const fullName = `${name}, ${fullRegionPath ? fullRegionPath + ', ' : ''}${countryName}`;
        
        if (debugMode || (i % 1000 === 0 && i > 0)) {
          console.log(`Processing ${i}: ${name}, ${admin1Name}, ${countryName}`);
          if (debugMode) {
            console.log(`Full name: ${fullName}`);
          }
        }
        
        // Add the location to the batch
        locationsToProcess.push({
          city: name,
          region: admin1Name, // Use admin1Name as region instead of admin1Code
          country: countryName,
          geoname_id: geonameId,
          latitude: latitude,
          longitude: longitude,
          admin_code1: admin1Code,
          admin_code2: admin2Code,
          admin_name2: admin2Name,
          timezone: timezone,
          full_name: fullName,
          full_region_path: fullRegionPath
        });
        
        // Process in database batches when we reach batchSize
        if (locationsToProcess.length >= batchSize) {
          console.log(`Processing database batch of ${locationsToProcess.length} records`);
          const result = await processLocationBatch(supabase, locationsToProcess, debugMode);
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
        console.log(`Processing final batch of ${locationsToProcess.length} records`);
        const result = await processLocationBatch(supabase, locationsToProcess, debugMode);
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
      
      // Check if there are more lines to process beyond the current limit
      const hasMoreData = maxIndex < lines.length;
      
      console.log(`Import complete. Filtered locations: ${filteredLocations}, Inserted: ${totalInsertedCount}, Updated: ${totalUpdatedCount}, Skipped: ${totalSkippedCount}`);
      
      // Generate continuation token if there's more data and items were actually found
      const continuationToken = hasMoreData ? btoa(JSON.stringify({
        nextOffset: maxIndex,
        country,
        minPopulation
      })) : null;
      
      // Only say there's more data if we actually processed some locations and there are more lines
      const effectiveHasMoreData = hasMoreData && filteredLocations > 0;
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Successfully imported locations from file',
        count: totalInsertedCount,
        updated: totalUpdatedCount,
        skipped: totalSkippedCount,
        total: totalInsertedCount + totalUpdatedCount + totalSkippedCount,
        filteredLocations,
        hasMoreData: effectiveHasMoreData,
        nextOffset: effectiveHasMoreData ? maxIndex : null,
        continuationToken: effectiveHasMoreData ? continuationToken : null,
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

// Helper function to load country info mapping from countryInfo.txt
async function loadCountryInfoMapping(supabase) {
  try {
    console.log('Loading country info mapping from countryInfo.txt');
    
    const { data: textData, error: textError } = await supabase
      .storage
      .from('location-data')
      .download('countryInfo.txt');
    
    if (textError) {
      console.error('Error fetching countryInfo.txt from storage:', textError);
      return {}; // Return empty mapping on error
    }
    
    // Convert text file to string
    const countryInfoText = new TextDecoder().decode(await textData.arrayBuffer());
    console.log(`Read ${countryInfoText.length} characters from countryInfo.txt`);
    
    // Parse the country info
    const countryMap = {};
    const lines = countryInfoText.split('\n');
    
    for (const line of lines) {
      // Skip comment lines
      if (line.trim().startsWith('#')) continue;
      
      const fields = line.split('\t');
      if (fields.length >= 5) {
        // ISO code is the first field, country name is the 5th field (index 4)
        const isoCode = fields[0];
        const countryName = fields[4];
        
        if (isoCode && countryName) {
          countryMap[isoCode] = countryName;
        }
      }
    }
    
    console.log(`Loaded ${Object.keys(countryMap).length} country code mappings`);
    return countryMap;
    
  } catch (error) {
    console.error('Error loading country info mapping:', error);
    return {}; // Return empty mapping on error
  }
}

// Function to load admin1 code mapping from admin1CodeASCII.txt
async function loadAdmin1CodeMapping(supabase) {
  try {
    console.log('Loading admin1 code mapping from admin1CodesASCII.txt');
    
    const { data: textData, error: textError } = await supabase
      .storage
      .from('location-data')
      .download('admin1CodesASCII.txt');
    
    if (textError) {
      console.error('Error fetching admin1CodesASCII.txt from storage:', textError);
      return {}; // Return empty mapping on error
    }
    
    // Convert text file to string
    const admin1CodeText = new TextDecoder().decode(await textData.arrayBuffer());
    console.log(`Read ${admin1CodeText.length} characters from admin1CodesASCII.txt`);
    
    // Parse the admin1 code info
    // Format: code, name, name_ascii, geonameid
    const admin1Map = {};
    const lines = admin1CodeText.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const fields = line.split('\t');
      if (fields.length >= 2) {
        // Admin code key is the first field (e.g., "AT.02")
        // Name is the second field
        const codeKey = fields[0].trim();
        const name = fields[1].trim();
        
        if (codeKey && name) {
          admin1Map[codeKey] = name;
          // Debug log for specific countries
          if (codeKey.startsWith('IL.')) {
            console.log(`Admin1 mapping for Israel: ${codeKey} -> ${name}`);
          }
        }
      }
    }
    
    console.log(`Loaded ${Object.keys(admin1Map).length} admin1 code mappings`);
    return admin1Map;
    
  } catch (error) {
    console.error('Error loading admin1 code mapping:', error);
    return {}; // Return empty mapping on error
  }
}

// Function to load admin2 code mapping from admin2Codes.txt
async function loadAdmin2CodeMapping(supabase) {
  try {
    console.log('Loading admin2 code mapping from admin2Codes.txt');
    
    const { data: textData, error: textError } = await supabase
      .storage
      .from('location-data')
      .download('admin2Codes.txt');
    
    if (textError) {
      console.error('Error fetching admin2Codes.txt from storage:', textError);
      return {}; // Return empty mapping on error
    }
    
    // Convert text file to string
    const admin2CodeText = new TextDecoder().decode(await textData.arrayBuffer());
    console.log(`Read ${admin2CodeText.length} characters from admin2Codes.txt`);
    
    // Parse the admin2 code info
    // Format: code, name, name_ascii, geonameid
    const admin2Map = {};
    const lines = admin2CodeText.split('\n');
    
    for (const line of lines) {
      if (!line.trim()) continue;
      
      const fields = line.split('\t');
      if (fields.length >= 2) {
        // Admin code key is the first field (e.g., "AT.02.207")
        // Name is the second field
        const codeKey = fields[0].trim();
        const name = fields[1].trim();
        
        if (codeKey && name) {
          admin2Map[codeKey] = name;
          // Debug log for specific countries
          if (codeKey.startsWith('IL.')) {
            console.log(`Admin2 mapping for Israel: ${codeKey} -> ${name}`);
          }
        }
      }
    }
    
    console.log(`Loaded ${Object.keys(admin2Map).length} admin2 code mappings`);
    return admin2Map;
    
  } catch (error) {
    console.error('Error loading admin2 code mapping:', error);
    return {}; // Return empty mapping on error
  }
}

// Helper function to process a batch of locations
async function processLocationBatch(supabase, locations, debugMode = false) {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  
  try {
    // Process in smaller batches for the database
    const dbBatchSize = 100;
    
    for (let i = 0; i < locations.length; i += dbBatchSize) {
      const dbBatch = locations.slice(i, i + dbBatchSize);
      console.log(`Processing database batch ${Math.floor(i / dbBatchSize) + 1} of ${Math.ceil(locations.length / dbBatchSize)}`);
      
      try {
        if (debugMode) {
          console.log(`Sample record being inserted:`, dbBatch[0]);
        }
        
        // Use upsert to either insert or update based on geoname_id
        const { data, error, count } = await supabase
          .from('locations')
          .upsert(dbBatch, {
            onConflict: 'geoname_id', // Only use geoname_id as the conflict detection
            ignoreDuplicates: false, // Update the record if found
            returning: 'representation' // Return the full records
          });
        
        if (error) {
          console.error('Error upserting locations:', error);
          skippedCount += dbBatch.length;
        } else {
          if (debugMode && data) {
            console.log(`Upsert returned ${data.length} records`);
            if (data.length > 0) {
              console.log(`First returned record:`, data[0]);
            }
          }
          // Since we used 'representation', we know how many records were returned
          // But we don't know how many were inserted vs updated without more logic
          insertedCount += dbBatch.length;
        }
      } catch (batchError) {
        console.error('Error in batch operation:', batchError);
        
        // If batch fails, try one by one
        console.log('Attempting individual inserts as batch failed');
        
        for (const location of dbBatch) {
          try {
            // Try to insert or update each location
            const { error } = await supabase
              .from('locations')
              .upsert([location], { 
                onConflict: 'geoname_id',
                ignoreDuplicates: false
              });
            
            if (error) {
              console.error(`Error upserting location ${location.city}:`, error);
              skippedCount++;
            } else {
              insertedCount++;
            }
          } catch (singleError) {
            console.error('Error in individual upsert:', singleError);
            skippedCount++;
          }
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
