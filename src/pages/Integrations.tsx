import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const ACCOUNTS_API_URL = import.meta.env.DEV
  ? "http://localhost:3000/accounts"
  : "https://quddify-server.vercel.app/accounts";

export default function Integrations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCalendlyModalOpen, setIsCalendlyModalOpen] = useState(false);
  const [calendlyToken, setCalendlyToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OpenAI token state
  const [openaiToken, setOpenaiToken] = useState("");
  const [savedOpenaiToken, setSavedOpenaiToken] = useState("");
  const [isSavingOpenai, setIsSavingOpenai] = useState(false);

  // Fetch current openai_token from account
  useEffect(() => {
    if (!user?.id) return;
    fetch(`${ACCOUNTS_API_URL}/${user.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.openai_token) {
          setOpenaiToken(data.openai_token);
          setSavedOpenaiToken(data.openai_token);
        }
      })
      .catch(() => {});
  }, [user?.id]);

  const handleSaveOpenaiToken = async () => {
    if (!user?.id) return;
    setIsSavingOpenai(true);
    try {
      const response = await fetch(`${ACCOUNTS_API_URL}/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openai_token: openaiToken.trim() || null }),
      });
      if (response.ok) {
        const trimmed = openaiToken.trim();
        setSavedOpenaiToken(trimmed);
        toast({ title: "Saved", description: trimmed ? "OpenAI API key updated." : "OpenAI API key removed. Using server default." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to save API key", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSavingOpenai(false);
    }
  };

  const openaiTokenChanged = openaiToken.trim() !== savedOpenaiToken;

  const handleCalendlySubmit = async () => {
    if (!calendlyToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Calendly token",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const API_URL = import.meta.env.DEV
      ? "http://localhost:3000/api/calendly/add"
      : "https://quddify-server.vercel.app/api/calendly/add";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: calendlyToken,
          user: user,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Calendly token added successfully",
        });
        setIsCalendlyModalOpen(false);
        setCalendlyToken("");
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to add Calendly token",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsCalendlyModalOpen(false);
    setCalendlyToken("");
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Connect and manage your third-party integrations
        </p>
      </div>

      {/* OpenAI API Key */}
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Key</CardTitle>
          <CardDescription>
            Provide your own OpenAI key for lead qualification. Leave empty to use the server default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="openai-token">API Key</Label>
            <Input
              id="openai-token"
              type="password"
              placeholder="sk-..."
              value={openaiToken}
              onChange={(e) => setOpenaiToken(e.target.value)}
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {savedOpenaiToken ? "Custom key active" : "Using server default"}
            </p>
            <Button
              size="sm"
              onClick={handleSaveOpenaiToken}
              disabled={isSavingOpenai || !openaiTokenChanged}
            >
              {isSavingOpenai ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Calendly Integration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Calendly</CardTitle>
            <CardDescription>
              Connect your Calendly account to sync scheduling data
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={() => setIsCalendlyModalOpen(true)}
              className="w-full"
            >
              Connect Calendly
            </Button>
          </CardContent>
        </Card>

        {/* Placeholder for future integrations */}
        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Google Calendar</CardTitle>
            <CardDescription>
              Sync events with your Google Calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>

        <Card className="opacity-50">
          <CardHeader>
            <CardTitle>Slack</CardTitle>
            <CardDescription>
              Get notifications in your Slack workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled className="w-full">
              Coming Soon
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Calendly Token Modal */}
      <Dialog open={isCalendlyModalOpen} onOpenChange={setIsCalendlyModalOpen}>
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
              value={calendlyToken}
              onChange={(e) => setCalendlyToken(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCalendlySubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
