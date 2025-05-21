
import { useChatChannels } from "@/hooks/chat/useChatChannels";
import { useEffect } from "react";
import { assignStandardTagsToChannels } from "./chatChannelTags";
import { logger } from "@/utils/logger";

/**
 * Hook to automatically apply standard tags to channels on initial load
 */
export function useApplyInitialTags() {
  const { data: channels = [], isLoading } = useChatChannels();
  
  useEffect(() => {
    // Only run this once when channels are loaded
    if (!isLoading && channels.length > 0) {
      logger.info("Automatically applying initial tags to chat channels");
      assignStandardTagsToChannels(channels).catch(error => {
        logger.error("Failed to apply initial tags:", error);
      });
    }
  }, [isLoading, channels.length]);
  
  return null;
}
