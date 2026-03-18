import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Send } from "lucide-react";
import {
  useOutboundLeadNotes,
  useCreateOutboundLeadNote,
  useDeleteLeadNote,
  type LeadNote,
} from "@/hooks/useLeadNotes";

interface QuickNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outboundLeadId: string;
  contactName: string;
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffH = diffMs / (1000 * 60 * 60);
  const diffD = diffH / 24;
  if (diffH < 1) return `${Math.max(1, Math.round(diffMs / 60000))}m ago`;
  if (diffH < 24) return `${Math.round(diffH)}h ago`;
  if (diffD < 2) return "1d ago";
  return `${Math.round(diffD)}d ago`;
}

export function QuickNoteDialog({
  open,
  onOpenChange,
  outboundLeadId,
  contactName,
}: QuickNoteDialogProps) {
  const { data: notes, isLoading } = useOutboundLeadNotes(open ? outboundLeadId : undefined);
  const createNote = useCreateOutboundLeadNote();
  const deleteNote = useDeleteLeadNote();
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      setContent("");
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSubmit = () => {
    if (!content.trim()) return;
    createNote.mutate(
      { outbound_lead_id: outboundLeadId, content: content.trim() },
      { onSuccess: () => setContent("") },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Notes — {contactName}
          </DialogTitle>
        </DialogHeader>

        {/* Notes list */}
        <ScrollArea className="max-h-[300px] pr-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 rounded-md bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : !notes?.length ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No notes yet. Add the first one below.
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map((note: LeadNote) => (
                <div
                  key={note._id}
                  className="group rounded-md border bg-muted/30 px-3 py-2 text-xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-foreground">
                      {note.author_name}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground text-[10px]">
                        {timeAgo(note.createdAt)}
                      </span>
                      <button
                        onClick={() =>
                          deleteNote.mutate({
                            id: note._id,
                            lead_id: note.outbound_lead_id || note.lead_id || "",
                          })
                        }
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-foreground/80 whitespace-pre-wrap">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* New note input */}
        <div className="flex gap-2 pt-2 border-t">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a note... (Ctrl+Enter to send)"
            rows={2}
            className="resize-none text-xs"
          />
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || createNote.isPending}
            className="shrink-0 self-end"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
