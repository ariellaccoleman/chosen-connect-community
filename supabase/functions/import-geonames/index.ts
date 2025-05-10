
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
    const { country, maxResults = 1000, minPopulation = 15000 } = requestData;
    
    if (!country) {
      console.error('Missing country parameter');
      return new Response(JSON.stringify({
        error: 'Country parameter is required'
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      });
    }
    
    console.log(`Fetching cities for country: ${country}, minPopulation: ${minPopulation}`);
    
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
    
    const geoNamesUrl = `http://api.geonames.org/searchJSON?country=${country}&cities=cities1000&maxRows=${maxResults}&username=${geoNamesUsername}&orderby=population&style=full`;
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
      return new Response(JSON.stringify({
        success: true,
        message: `No cities found for ${country} with population >= ${minPopulation}`,
        count: 0
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Prepare data for batch insert
    const locationsToInsert = cities.map((city) => ({
      city: city.name || '',
      region: city.adminName1 || '',
      country: city.countryName || ''
    }));
    
    // Insert into the locations table
    try {
      let insertedCount = 0;
      const batchSize = 100;
      
      // Process locations in batches to avoid overloading the database
      for (let i = 0; i < locationsToInsert.length; i += batchSize) {
        const batch = locationsToInsert.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(locationsToInsert.length / batchSize)}`);
        
        // For each location in the batch, check if it already exists
        for (const location of batch) {
          const { data: existingLocations, error: checkError } = await supabase
            .from('locations')
            .select('id')
            .eq('city', location.city)
            .eq('region', location.region)
            .eq('country', location.country)
            .limit(1);
          
          if (checkError) {
            console.error('Error checking for existing location:', checkError);
            continue;
          }
          
          // Only insert if the location doesn't exist
          if (!existingLocations || existingLocations.length === 0) {
            const { error: insertError } = await supabase
              .from('locations')
              .insert(location);
            
            if (insertError) {
              console.error('Error inserting location:', insertError);
            } else {
              insertedCount++;
            }
          } else {
            console.log(`Location already exists: ${location.city}, ${location.region}, ${location.country}`);
          }
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully imported cities from GeoNames for ${country}`,
        count: insertedCount,
        total: locationsToInsert.length,
        skipped: locationsToInsert.length - insertedCount
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
