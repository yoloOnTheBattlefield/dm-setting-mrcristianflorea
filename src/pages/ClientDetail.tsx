import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";

interface ClientData {
  account_id: string;
  ghl: string;
  name: string;
  ghl_lead_booked_webhook?: string;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [client, setClient] = useState<ClientData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ghlWebhookUrl, setGhlWebhookUrl] = useState("");
  const [ghlValidationError, setGhlValidationError] = useState("");
  const [isGhlSaving, setIsGhlSaving] = useState(false);

  // Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      const API_URL = import.meta.env.DEV
        ? "http://localhost:3000/accounts/ghl-webhook"
        : "https://quddify-server.vercel.app/accounts/ghl-webhook";

      try {
        const response = await fetch(`${API_URL}?_id=${id}`);
        if (response.ok) {
          const data = await response.json();
          setClient(data);
          if (data.ghl_lead_booked_webhook) {
            setGhlWebhookUrl(data.ghl_lead_booked_webhook);
          }
        } else {
          toast({
            title: "Error",
            description: "Failed to load client data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch client:", error);
        toast({
          title: "Error",
          description: "Failed to connect to the server",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [id, toast]);

  // Handle webhook URL change
  const handleGhlWebhookChange = (value: string) => {
    setGhlWebhookUrl(value);
    setGhlValidationError("");

    if (value && !value.startsWith("http")) {
      setGhlValidationError("URL must start with http or https");
    }
  };

  // Save webhook URL
  const handleGhlWebhookSave = async () => {
    if (!ghlWebhookUrl.startsWith("http")) {
      setGhlValidationError("URL must start with http or https");
      return;
    }

    if (!id) {
      toast({
        title: "Error",
        description: "Client ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsGhlSaving(true);

    const API_URL = import.meta.env.DEV
      ? "http://localhost:3000/accounts/ghl-webhook"
      : "https://quddify-server.vercel.app/accounts/ghl-webhook";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _id: id,
          ghl_lead_booked_webhook: ghlWebhookUrl,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Webhook saved successfully",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.message || "Failed to save webhook",
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
      setIsGhlSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Loading...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Client not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{client.name}</h2>
          <p className="text-muted-foreground">Client settings and integrations</p>
        </div>
      </div>

      <div className="grid gap-4">
        {/* Client Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Basic client details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label className="text-muted-foreground">Account ID</Label>
              <p className="font-medium">{client.account_id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">GHL ID</Label>
              <p className="font-medium">{client.ghl}</p>
            </div>
          </CardContent>
        </Card>

        {/* GoHighLevel Webhook Card */}
        <Card>
          <CardHeader>
            <CardTitle>GoHighLevel Integration</CardTitle>
            <CardDescription>
              Configure webhook URLs for automation triggers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Lead Booked Webhook</h4>
              <div className="space-y-2">
                <Label htmlFor="ghl-webhook-url">Webhook URL</Label>
                <Input
                  id="ghl-webhook-url"
                  type="url"
                  placeholder="https://services.leadconnectorhq.com/hooks/..."
                  value={ghlWebhookUrl}
                  onChange={(e) => handleGhlWebhookChange(e.target.value)}
                  className={ghlValidationError ? "border-destructive" : ""}
                />
                {ghlValidationError && (
                  <p className="text-sm text-destructive">{ghlValidationError}</p>
                )}
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleGhlWebhookSave}
                  disabled={!ghlWebhookUrl || isGhlSaving || !!ghlValidationError}
                >
                  {isGhlSaving ? "Saving..." : "Save Webhook"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
