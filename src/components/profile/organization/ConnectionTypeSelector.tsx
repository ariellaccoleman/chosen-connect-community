
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface ConnectionTypeSelectorProps {
  value: "current" | "former" | "connected_insider";
  onChange: (value: "current" | "former" | "connected_insider") => void;
}

const ConnectionTypeSelector = ({ value, onChange }: ConnectionTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Connection Type</label>
      <Select 
        value={value} 
        onValueChange={(value: "current" | "former" | "connected_insider") => onChange(value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select connection type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="current">Current Employee</SelectItem>
          <SelectItem value="former">Former Employee</SelectItem>
          <SelectItem value="connected_insider">Connected Insider</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ConnectionTypeSelector;
