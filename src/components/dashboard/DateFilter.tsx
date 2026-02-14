import { DateRangeFilter } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  value: DateRangeFilter;
  onChange: (value: DateRangeFilter) => void;
}

const options: { value: DateRangeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: 1, label: "Today" },
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

export function DateFilter({ value, onChange }: DateFilterProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border bg-card p-1 overflow-x-auto">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm font-medium transition-colors whitespace-nowrap",
            value === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
