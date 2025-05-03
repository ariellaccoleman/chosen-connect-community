
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";

interface CommunitySearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const CommunitySearch = ({ searchQuery, setSearchQuery }: CommunitySearchProps) => {
  const [inputValue, setInputValue] = useState(searchQuery);
  
  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(inputValue);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue, setSearchQuery]);
  
  return (
    <div className="relative mb-8">
      <Input
        type="text"
        placeholder="Search community members..."
        className="pl-10"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
    </div>
  );
};

export default CommunitySearch;
