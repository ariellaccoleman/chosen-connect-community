
/**
 * Re-export all profile API modules
 */
export { profileApi } from "./profileApiFactory";
export {
  getAllProfiles,
  getProfileById,
  getProfilesByIds,
  createProfile,
  updateProfile,
  deleteProfile
} from "./profileApiFactory";
