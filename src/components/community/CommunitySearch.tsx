
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CommunitySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CommunitySearch = ({ searchQuery, setSearchQuery }: CommunitySearchProps) => {
  return (
    <div className="relative mb-8">
      <Input
        type="text"
        placeholder="Search community members..."
        className="pl-10"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>
  );
};

export default CommunitySearch;
