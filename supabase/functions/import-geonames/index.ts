
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeoNameCity {
  geonameId: number;
  name: string;
  countryCode: string;
  countryName: string;
  adminName1: string; // region/state
  population: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the request body
    const requestData = await req.json();
    const { country, maxResults = 1000, minPopulation = 15000 } = requestData;

    if (!country) {
      return new Response(
        JSON.stringify({ error: 'Country parameter is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Fetching cities for country: ${country}, minPopulation: ${minPopulation}`);

    // Fetch cities from GeoNames API
    const geoNamesUsername = Deno.env.get('GEONAMES_USERNAME');
    if (!geoNamesUsername) {
      return new Response(
        JSON.stringify({ error: 'GeoNames username is not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const geoNamesUrl = `http://api.geonames.org/searchJSON?country=${country}&cities=cities1000&maxRows=${maxResults}&username=${geoNamesUsername}&orderby=population&style=full`;

    console.log(`Calling GeoNames API: ${geoNamesUrl}`);
    const response = await fetch(geoNamesUrl);
    const data = await response.json();

    if (!data.geonames) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch data from GeoNames', details: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Found ${data.geonames.length} cities`);

    // Filter cities by population
    const cities = data.geonames.filter(
      (city: any) => city.population >= minPopulation
    );
    
    console.log(`Filtered to ${cities.length} cities with population >= ${minPopulation}`);

    // Prepare data for batch insert
    const locationsToInsert = cities.map((city: any) => ({
      city: city.name,
      region: city.adminName1,
      country: city.countryName,
      full_name: `${city.name}, ${city.adminName1}, ${city.countryName}`,
    }));

    // Insert into the locations table
    const { data: insertData, error } = await supabase
      .from('locations')
      .upsert(locationsToInsert, { 
        onConflict: 'full_name',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('Error inserting locations:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert locations', details: error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully imported cities from GeoNames for ${country}`,
        count: locationsToInsert.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in import-geonames function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
