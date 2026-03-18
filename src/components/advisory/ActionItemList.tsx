import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import type { ActionItem } from "@/lib/advisory-types";

interface ActionItemListProps {
  items: ActionItem[];
  onToggle?: (index: number, completed: boolean) => void;
}

export default function ActionItemList({ items, onToggle }: ActionItemListProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">No action items</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => {
        const isOverdue =
          item.due_date && !item.completed && new Date(item.due_date) < new Date();
        return (
          <li key={item._id} className="flex items-start gap-2">
            <Checkbox
              checked={item.completed}
              onCheckedChange={(checked) => onToggle?.(index, !!checked)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span
                className={cn(
                  "text-sm",
                  item.completed && "line-through text-muted-foreground"
                )}
              >
                {item.task}
              </span>
              <div className="flex items-center gap-3 mt-0.5">
                {item.owner && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    {item.owner}
                  </span>
                )}
                {item.due_date && (
                  <span
                    className={cn(
                      "text-xs",
                      isOverdue ? "text-red-400" : "text-muted-foreground"
                    )}
                  >
                    Due{" "}
                    {new Date(item.due_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
