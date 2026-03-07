import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalendlyTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  token: string;
  onTokenChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function CalendlyTokenModal({
  open,
  onOpenChange,
  token,
  onTokenChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: CalendlyTokenModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Calendly Token</DialogTitle>
          <DialogDescription>
            Watch the tutorial below to learn how to get your Calendly API
            token
          </DialogDescription>
        </DialogHeader>

        {/* Tutorial Video */}
        <div className="w-full" style={{ aspectRatio: "16/9" }}>
          <iframe
            src="https://scribehow.com/embed/Connect_Calendly_to_Your_DM_Settings__u05VqL8yQrSDlTONdLtVgg?as=video"
            width="100%"
            height="100%"
            allow="fullscreen"
            style={{ border: 0 }}
            title="Calendly Integration Tutorial"
          />
        </div>

        <div className="py-4">
          <Label htmlFor="calendly-token">Token</Label>
          <Input
            id="calendly-token"
            type="text"
            placeholder="Enter your Calendly token"
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
            className="mt-2"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
