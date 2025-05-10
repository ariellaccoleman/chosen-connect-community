
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
    const { country, maxResults = 1000, minPopulation = 15000, globalImport = false } = requestData;
    
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
    
    let geoNamesUrl;
    if (globalImport) {
      console.log(`Fetching global cities with minimum population: ${minPopulation}`);
      // Use cities1000 dataset (cities with population > 1000)
      geoNamesUrl = `http://api.geonames.org/searchJSON?cities=cities1000&maxRows=${maxResults}&username=${geoNamesUsername}&orderby=population&style=full`;
    } else {
      console.log(`Fetching cities for country: ${country}, minPopulation: ${minPopulation}`);
      geoNamesUrl = `http://api.geonames.org/searchJSON?country=${country}&cities=cities1000&maxRows=${maxResults}&username=${geoNamesUsername}&orderby=population&style=full`;
    }
    
    console.log(`Calling GeoNames API: ${geoNamesUrl}`);
    
    const response = await fetch(geoNamesUrl);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('GeoNames API returned an error', data);
      return new Response(JSON.stringify({
        error: 'GeoNames API returned an error',
        details: data
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
        details: data
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
    
    console.log(`Found ${data.geonames.length} cities`);
    
    // Filter cities by population
    const cities = data.geonames.filter((city) => city.population >= minPopulation);
    console.log(`Filtered to ${cities.length} cities with population >= ${minPopulation}`);
    
    if (cities.length === 0) {
      const source = globalImport ? 'globally' : `for ${country}`;
      return new Response(JSON.stringify({
        success: true,
        message: `No cities found ${source} with population >= ${minPopulation}`,
        count: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Prepare data for batch insert - IMPORTANT: Don't include full_name, it's generated
    const locationsToInsert = cities.map((city) => ({
      city: city.name || '',
      region: city.adminName1 || '',
      country: city.countryName || '',
      // Add the new fields
      geoname_id: city.geonameId || null,
      latitude: city.lat || null,
      longitude: city.lng || null,
      admin_code1: city.adminCode1 || null,
      admin_code2: city.adminCode2 || null,
      admin_name2: city.adminName2 || null,
      timezone: city.timezone?.timeZoneId || null
    }));
    
    // Insert into the locations table
    try {
      // Modified upsert operation - using the new unique constraint on geoname_id
      const batchSize = 100;
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      
      // Process locations in batches
      for (let i = 0; i < locationsToInsert.length; i += batchSize) {
        const batch = locationsToInsert.slice(i, i + batchSize);
        console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(locationsToInsert.length / batchSize)}`);
        
        // Primary strategy: Use geoname_id for conflict resolution if available
        const batchWithGeonameIds = batch.filter(location => location.geoname_id !== null);
        if (batchWithGeonameIds.length > 0) {
          const { data: insertResultGeoname, error: insertErrorGeoname } = await supabase
            .from('locations')
            .upsert(batchWithGeonameIds, { 
              onConflict: 'geoname_id',  // Now this will work with our unique constraint
              ignoreDuplicates: false    // Update existing records
            })
            .select();
          
          if (insertErrorGeoname) {
            console.error('Error upserting locations with geoname_id:', insertErrorGeoname);
          } else if (insertResultGeoname) {
            insertedCount += insertResultGeoname.length;
            updatedCount += (batchWithGeonameIds.length - insertResultGeoname.length);
          }
        }
        
        // Fallback strategy: For entries without geoname_id, use city/region/country
        const batchWithoutGeonameIds = batch.filter(location => location.geoname_id === null);
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
      
      const source = globalImport ? 'globally' : `for ${country}`;
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully imported cities from GeoNames ${source}`,
        count: insertedCount,
        updated: updatedCount,
        total: locationsToInsert.length,
        skipped: skippedCount
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (insertError) {
      console.error('Exception during database insert:', insertError);
      return new Response(JSON.stringify({
        error: 'Exception during database insert',
        details: insertError.message
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 500
      });
    }
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
