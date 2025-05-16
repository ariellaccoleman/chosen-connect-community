
/**
 * Tag type constants
 */
export const TAG_TYPES = {
  PERSON: "person",
  ORGANIZATION: "organization",
  EVENT: "event",
  GENERAL: "general",
} as const;

/**
 * Tag type utility functions and constants
 */
export const TAG_TYPE_LABELS = {
  [TAG_TYPES.PERSON]: "Person",
  [TAG_TYPES.ORGANIZATION]: "Organization",
  [TAG_TYPES.EVENT]: "Event",
  [TAG_TYPES.GENERAL]: "General",
};

export const getTagTypeLabel = (type: string): string => {
  return TAG_TYPE_LABELS[type as keyof typeof TAG_TYPE_LABELS] || "Unknown";
};
