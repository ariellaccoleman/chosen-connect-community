
import { organizationCrudApi as orgCrudApi } from "./organizationCrudApi";
import { organizationUpdateApi } from "./organizationUpdateApi";
import { organizationCreateApi } from "./organizationCreateApi";

/**
 * Combined organization API for backwards compatibility
 */
export const organizationCrudApi = {
  ...orgCrudApi,
  ...organizationUpdateApi,
  ...organizationCreateApi
};
