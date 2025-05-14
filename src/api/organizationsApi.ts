
/**
 * Re-export organization API functionality from modular files
 * This file is maintained for backward compatibility
 * @deprecated Use imports from src/api/organizations/index.ts instead
 */

export { organizationCrudApi as organizationsApi } from './organizations/organizationsApi';
export { organizationRelationshipsApi } from './organizations/relationshipsApi';
