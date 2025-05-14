
import { organizationCrudApi } from "./organizationCrudApi";
import { organizationUpdateApi } from "./organizationUpdateApi";
import { organizationCreateApi } from "./organizationCreateApi";

/**
 * Combined organization API for backwards compatibility
 */
export const organizationCrudApi = {
  ...organizationCrudApi,
  ...organizationUpdateApi,
  ...organizationCreateApi
};
