
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
    
    // Prepare data for batch insert - REMOVING full_name which is a generated column
    const locationsToInsert = cities.map((city) => ({
      city: city.name || '',
      region: city.adminName1 || '',
      country: city.countryName || ''
      // No longer including full_name as it's a generated column
    }));
    
    // Insert into the locations table
    try {
      // Use simple insert instead of upsert since we don't have a unique constraint
      const { data: insertData, error } = await supabase.from('locations').insert(locationsToInsert);
      
      if (error) {
        console.error('Error inserting locations:', error);
        return new Response(JSON.stringify({
          error: 'Failed to insert locations',
          details: error
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          },
          status: 500
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: `Successfully imported cities from GeoNames for ${country}`,
        count: locationsToInsert.length
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
