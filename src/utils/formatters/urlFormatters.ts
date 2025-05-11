
// Format website URL to ensure it has https://
export const formatWebsiteUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
};
