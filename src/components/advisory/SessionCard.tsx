import { useState } from "react";
import { AlertCircle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import ActionItemList from "./ActionItemList";
import type { AdvisorySession } from "@/lib/advisory-types";
import { useUpdateSession } from "@/hooks/useAdvisorySessions";

interface SessionCardProps {
  session: AdvisorySession;
}

export default function SessionCard({ session }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const updateSession = useUpdateSession();

  const handleToggleAction = (index: number, completed: boolean) => {
    const updatedItems = session.action_items.map((item, i) =>
      i === index ? { ...item, completed } : item
    );
    updateSession.mutate({
      id: session._id,
      body: { action_items: updatedItems } as Partial<AdvisorySession>,
    });
  };

  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="font-semibold text-foreground">
          {new Date(session.session_date).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
        {session.fathom_url && (
          <a
            href={session.fathom_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline shrink-0"
          >
            View Recording
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {session.bottleneck_identified && (
        <div className="flex items-center gap-1.5 text-sm text-amber-400 mb-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{session.bottleneck_identified}</span>
        </div>
      )}

      {session.summary && (
        <p
          className={cn(
            "text-sm text-muted-foreground mb-3 cursor-pointer",
            !expanded && "line-clamp-2"
          )}
          onClick={() => setExpanded(!expanded)}
        >
          {session.summary}
        </p>
      )}

      <ActionItemList items={session.action_items} onToggle={handleToggleAction} />
    </div>
  );
}
