
/**
 * Re-export all profile API modules
 */
export { profileApi, profileViewApi, profileCompositeApi } from "./profileApiFactory";
export {
  getAllProfiles,
  getProfileById,
  getProfilesByIds,
  createProfile,
  updateProfile,
  deleteProfile
} from "./profileApiFactory";
