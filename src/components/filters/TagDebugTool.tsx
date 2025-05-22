
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface TagDebugToolProps {
  tagId?: string;
  profileId?: string;
}

export const TagDebugTool = ({ tagId, profileId }: TagDebugToolProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [targetTagId, setTargetTagId] = useState(tagId || '');
  const [targetProfileId, setTargetProfileId] = useState(profileId || '');

  const checkAssignment = async () => {
    if (!targetTagId || !targetProfileId) {
      logger.warn("TagDebugTool: Missing tag ID or profile ID");
      return;
    }
    
    setIsLoading(true);
    try {
      // Query tag info
      const { data: tagData, error: tagError } = await supabase
        .from("tags")
        .select("*")
        .eq("id", targetTagId)
        .single();
        
      if (tagError) {
        logger.error("TagDebugTool: Error fetching tag info:", tagError);
      } else {
        logger.debug("TagDebugTool: Tag info:", tagData);
      }
      
      // Query profile info
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", targetProfileId)
        .single();
        
      if (profileError) {
        logger.error("TagDebugTool: Error fetching profile info:", profileError);
      } else {
        logger.debug("TagDebugTool: Profile info:", profileData);
      }
      
      // Query direct tag assignment
      const { data: assignmentData, error: assignmentError } = await supabase
        .from("tag_assignments")
        .select("*")
        .eq("tag_id", targetTagId)
        .eq("target_id", targetProfileId)
        .eq("target_type", "person");
        
      if (assignmentError) {
        logger.error("TagDebugTool: Error fetching tag assignment:", assignmentError);
      } else {
        logger.debug("TagDebugTool: Assignment data:", assignmentData);
      }
      
      // Query via the view
      const { data: viewData, error: viewError } = await supabase
        .from("entity_tag_assignments_view")
        .select("*")
        .eq("tag_id", targetTagId)
        .eq("target_id", targetProfileId);
        
      if (viewError) {
        logger.error("TagDebugTool: Error fetching from view:", viewError);
      } else {
        logger.debug("TagDebugTool: View data:", viewData);
      }
      
      setResults([
        { type: "Tag", data: tagData },
        { type: "Profile", data: profileData },
        { type: "Assignment", data: assignmentData },
        { type: "View", data: viewData }
      ]);
    } catch (e) {
      logger.error("TagDebugTool: Exception during lookup:", e);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Automatically check on initial load if both IDs are provided
  useEffect(() => {
    if (tagId && profileId) {
      checkAssignment();
    }
  }, []);

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-md flex items-center">
          <Tag className="h-4 w-4 mr-2" />
          Tag Assignment Debug
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <Input 
                placeholder="Tag ID" 
                value={targetTagId} 
                onChange={e => setTargetTagId(e.target.value)} 
              />
            </div>
            <div className="flex-1">
              <Input 
                placeholder="Profile ID" 
                value={targetProfileId} 
                onChange={e => setTargetProfileId(e.target.value)} 
              />
            </div>
            <Button 
              onClick={checkAssignment} 
              disabled={isLoading || !targetTagId || !targetProfileId}
              size="sm"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Check
            </Button>
          </div>
          
          {results.length > 0 && (
            <div className="mt-2 text-sm">
              <p className="text-muted-foreground mb-2">Results are logged to console</p>
              <div className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded max-h-40 overflow-y-auto">
                {results.map((result, index) => (
                  <div key={index} className="mb-2">
                    <p className="font-semibold">{result.type}:</p>
                    <pre className="text-xs overflow-x-auto">
                      {result.data ? JSON.stringify(result.data, null, 2) : "Not found"}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TagDebugTool;
