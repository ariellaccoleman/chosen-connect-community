
import { apiClient } from "../core/apiClient";
import { ApiResponse, createSuccessResponse } from "../core/errorHandler";
import { Hub, HubWithTag } from "@/types/hub";

/**
 * Get all hubs using the hub_details view
 */
export const getAllHubs = async (): Promise<ApiResponse<HubWithTag[]>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from("hub_details")
      .select("*")
      .order("name");

    if (error) throw error;
    return createSuccessResponse(data || []);
  });
};

/**
 * Get featured hubs for homepage display
 */
export const getFeaturedHubs = async (): Promise<ApiResponse<HubWithTag[]>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from("hub_details")
      .select("*")
      .eq("is_featured", true)
      .order("name");

    if (error) throw error;
    return createSuccessResponse(data || []);
  });
};

/**
 * Get a single hub by ID
 */
export const getHubById = async (id: string): Promise<ApiResponse<HubWithTag>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from("hub_details")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return createSuccessResponse(data);
  });
};

/**
 * Create a new hub (admin only)
 */
export const createHub = async (hub: Partial<Hub>): Promise<ApiResponse<Hub>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from("hubs")
      .insert([hub])
      .select()
      .single();

    if (error) throw error;
    return createSuccessResponse(data);
  });
};

/**
 * Update an existing hub (admin only)
 */
export const updateHub = async (id: string, updates: Partial<Hub>): Promise<ApiResponse<Hub>> => {
  return apiClient.query(async (client) => {
    const { data, error } = await client
      .from("hubs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return createSuccessResponse(data);
  });
};

/**
 * Toggle featured status of a hub (admin only)
 */
export const toggleHubFeatured = async (id: string, isFeatured: boolean): Promise<ApiResponse<Hub>> => {
  return updateHub(id, { is_featured: isFeatured });
};

/**
 * Delete a hub (admin only)
 */
export const deleteHub = async (id: string): Promise<ApiResponse<boolean>> => {
  return apiClient.query(async (client) => {
    const { error } = await client
      .from("hubs")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return createSuccessResponse(true);
  });
};
