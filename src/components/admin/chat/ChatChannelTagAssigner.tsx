
import React, { useState } from "react";
import { useChatChannels } from "@/hooks/chat/useChatChannels";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { assignStandardTagsToChannels } from "@/utils/chat/chatChannelTags";
import { toast } from "sonner";
import { Loader, CheckCircle } from "lucide-react";

/**
 * Component for admins to assign standard tags to chat channels
 */
const ChatChannelTagAssigner = () => {
  const { data: channels = [] } = useChatChannels();
  const [isAssigning, setIsAssigning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleAssignTags = async () => {
    setIsAssigning(true);
    setIsComplete(false);
    
    try {
      await assignStandardTagsToChannels(channels);
      toast.success("Tags assigned to channels successfully");
      setIsComplete(true);
    } catch (error) {
      console.error("Error assigning tags:", error);
      toast.error("Failed to assign tags to channels");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standard Tag Assignment</CardTitle>
        <CardDescription>
          Assign standard tags to chat channels based on their names
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          This will assign the following tags:<br />
          - "Campus Issues" to Campus Issues channels<br />
          - "Mental Health" to Mental Health channels<br />
          - "Israel Tech" to Israel Tech channels
        </p>
        
        <Button 
          onClick={handleAssignTags} 
          disabled={isAssigning || channels.length === 0 || isComplete}
          className="w-full"
        >
          {isAssigning ? (
            <>
              <Loader size={16} className="mr-2 animate-spin" />
              Assigning Tags...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle size={16} className="mr-2" />
              Tags Assigned
            </>
          ) : (
            "Assign Standard Tags"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default ChatChannelTagAssigner;
