
/**
 * Re-export organization mutations from the new module for backward compatibility
 */
import {
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship
} from './organizations';

export {
  useAddOrganizationRelationship,
  useUpdateOrganizationRelationship,
  useDeleteOrganizationRelationship
};
