
export { resetProfileApi } from '../profiles/profileApiFactory';
export { resetOrganizationApi } from '../organizations/organizationApiFactory';
export { resetEventApi } from '../events/eventApiFactory';
export { resetHubApi } from '../hubs/hubApiFactory';
export { resetLocationsApi } from '../locations/locationsApi';
export { resetChatChannelsApi } from '../chat/chatChannelsApi';
export { resetChatMessageApi } from '../chat/chatMessageApiFactory';
export { resetTagApi } from '../tags/factory/tagApiFactory';
export { resetPostsApi } from '../posts/postsApiFactory';

// Central function that resets all APIs
export const resetAllApis = (client: any) => ({
  profile: resetProfileApi(client),
  organization: resetOrganizationApi(client),
  event: resetEventApi(client),
  hub: resetHubApi(client),
  locations: resetLocationsApi(client),
  chatChannels: resetChatChannelsApi(client),
  chatMessage: resetChatMessageApi(client),
  tag: resetTagApi(client),
  posts: resetPostsApi(client)
});
