
import { apiClient } from '../core/apiClient';
import { createSuccessResponse, ApiResponse } from '../core/errorHandler';
import { Tag } from '@/utils/tags/types';
import { EntityType, isValidEntityType } from '@/types/entityTypes';

/**
 * Base function to query tags with filtering options
 */
export const getTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  skipCache?: boolean;
} = {}): Promise<ApiResponse<Tag[]>> => {
  const { type, createdBy, searchQuery, skipCache } = options;

  return apiClient.query(async (client) => {
    const query = client
      .from('tags')
      .select('*');

    // Filter by type if provided
    if (type) {
      query.eq('type', type);
    }

    // Filter by creator if provided
    if (createdBy) {
      query.eq('created_by', createdBy);
    }

    // Search by name if provided
    if (searchQuery) {
      query.ilike('name', `%${searchQuery}%`);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    return createSuccessResponse(data || []);
  });
};

/**
 * Get tags optimized for filtering UI
 * These are tags with at least one assignment
 */
export const getFilterTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: EntityType | string;
} = {}): Promise<ApiResponse<Tag[]>> => {
  const { type, createdBy, searchQuery, targetType } = options;

  return apiClient.query(async (client) => {
    // Start building the query
    let query = client
      .from('tags')
      .select(`
        *,
        tag_assignments!inner(*)
      `);

    // Filter by type if provided
    if (type) {
      query = query.eq('type', type);
    }

    // Filter by creator if provided
    if (createdBy) {
      query = query.eq('created_by', createdBy);
    }

    // Search by name if provided
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    // Filter by target type if provided
    if (targetType && isValidEntityType(targetType)) {
      query = query.eq('tag_assignments.target_type', targetType);
    }

    // Execute the query
    const { data, error } = await query
      .order('name')
      .limit(100);

    if (error) throw error;

    // Remove duplicate tags and the assignments data
    const uniqueTags = data ? Array.from(
      new Map(data.map(item => [item.id, { ...item, tag_assignments: undefined }])).values()
    ) : [];

    return createSuccessResponse(uniqueTags as Tag[]);
  });
};

/**
 * Get tags optimized for selection UI
 * These include tags specific to the entity type plus general tags
 */
export const getSelectionTags = async (options: {
  type?: string;
  createdBy?: string;
  searchQuery?: string;
  targetType?: string;
  skipCache?: boolean;
} = {}): Promise<ApiResponse<Tag[]>> => {
  const { targetType } = options;

  return apiClient.query(async (client) => {
    let query = client
      .from('tags')
      .select('*');

    // Filter by search query if provided
    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`);
    }

    // If targetType is provided, get tags that have that entity type
    if (targetType && isValidEntityType(targetType)) {
      query = query.in('id', client
        .from('tag_entity_types')
        .select('tag_id')
        .eq('entity_type', targetType));
    }

    const { data, error } = await query
      .order('name')
      .limit(50);

    if (error) throw error;

    return createSuccessResponse(data || []);
  });
};
