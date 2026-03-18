import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MetricInputRowProps {
  label: string;
  name: string;
  value: number | string;
  onChange: (value: string) => void;
}

export default function MetricInputRow({ label, name, value, onChange }: MetricInputRowProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={0}
      />
    </div>
  );
}
