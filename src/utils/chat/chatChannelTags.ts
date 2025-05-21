
import { ChatChannel } from "@/types/chat";
import { EntityType } from "@/types/entityTypes";
import { assignTag, findOrCreateTag } from "@/utils/tags";
import { logger } from "@/utils/logger";
import { toast } from "sonner";

/**
 * Create and assign tags to chat channels
 * This utility helps with associating standard tags with specific chat channels
 */
export async function assignTagToChannel(
  channelId: string,
  tagName: string,
  tagDescription?: string
): Promise<boolean> {
  try {
    logger.info(`Attempting to assign tag "${tagName}" to channel ${channelId}`);
    
    // First find or create the tag
    const tag = await findOrCreateTag({
      name: tagName,
      description: tagDescription || `Tag for ${tagName}`,
      type: EntityType.CHAT.toString()
    });
    
    if (!tag) {
      logger.error(`Failed to find or create tag: ${tagName}`);
      toast.error(`Failed to associate tag "${tagName}" with channel`);
      return false;
    }
    
    // Then assign it to the channel
    const assignResult = await assignTag(tag.id, channelId, EntityType.CHAT);
    
    if (assignResult.error) {
      logger.error(`Failed to assign tag ${tag.id} to channel ${channelId}:`, assignResult.error);
      toast.error(`Failed to associate tag "${tagName}" with channel`);
      return false;
    }
    
    logger.info(`Successfully assigned tag "${tagName}" (${tag.id}) to channel ${channelId}`);
    return true;
  } catch (error) {
    logger.error(`Exception assigning tag "${tagName}" to channel ${channelId}:`, error);
    toast.error(`Failed to associate tag "${tagName}" with channel`);
    return false;
  }
}

/**
 * Execute tag assignments based on channel name patterns
 */
export async function assignStandardTagsToChannels(channels: ChatChannel[]): Promise<void> {
  for (const channel of channels) {
    if (!channel.id || !channel.name) continue;
    
    // Add standard tags based on channel names
    const name = channel.name.toLowerCase();
    
    if (name.includes("campus issues")) {
      await assignTagToChannel(channel.id, "Campus Issues", "Topics related to campus issues and concerns");
    }
    
    if (name.includes("mental health")) {
      await assignTagToChannel(channel.id, "Mental Health", "Discussions about mental health and wellness");
    }
    
    if (name.includes("israel tech")) {
      await assignTagToChannel(channel.id, "Israel Tech", "Discussions about Israeli technology and startups");
    }
  }
}
