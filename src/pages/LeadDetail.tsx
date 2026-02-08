import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AlertCircle, RefreshCw, CalendarCheck, DollarSign, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
function parseBoldSectionsToObject(str) {
  const regex = /<b>(.*?)<\/b>\s*([\s\S]*?)(?=<b>|$)/g;
  const obj = {};

  let match;
  while ((match = regex.exec(str)) !== null) {
    const key = match[1].trim();
    const value = match[2]
      .replace(/\n+/g, "\n") // collapse extra newlines
      .trim();

    obj[key] = value;
  }

  return obj;
}

const API_URL = import.meta.env.DEV
  ? "http://localhost:3000/leads"
  : "https://quddify-server.vercel.app/leads";

async function fetchLead(contactId: string): Promise<ApiLead> {
  const response = await fetch(`${API_URL}/${contactId}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch lead: ${response.status}`);
  }

  const data: ApiLead = await response.json();
  return data;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Not set";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getLeadStatus(lead: ApiLead): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  color: string;
} {
  if (lead.booked_at)
    return {
      label: "Booked",
      variant: "default",
      color: "bg-stage-booked text-white",
    };
  if (lead.ghosted_at)
    return {
      label: "Ghosted",
      variant: "destructive",
      color: "bg-stage-ghosted text-white",
    };
  if (lead.follow_up_at)
    return {
      label: "Follow Up",
      variant: "secondary",
      color: "bg-stage-fup text-white",
    };
  if (lead.link_sent_at)
    return {
      label: "Link Sent",
      variant: "secondary",
      color: "bg-stage-link-sent text-white",
    };
  return { label: "New", variant: "outline", color: "" };
}

export default function LeadDetail() {
  const { contactId } = useParams<{ contactId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isBooking, setIsBooking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [contractInput, setContractInput] = useState("");

  const {
    data: lead,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["lead", contactId],
    queryFn: () => fetchLead(contactId!),
    enabled: !!contactId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const handleMarkAsBooked = async () => {
    if (!contactId) return;

    setIsBooking(true);
    try {
      const response = await fetch(`${API_URL}/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booked_at: new Date().toISOString() }),
      });

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["lead", contactId] });
        toast({ title: "Success", description: "Lead marked as booked." });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({
          title: "Error",
          description: data.error || "Failed to update lead",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to connect to the server",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  const patchLead = async (body: Record<string, unknown>, successMsg: string) => {
    if (!contactId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ["lead", contactId] });
        toast({ title: "Success", description: successMsg });
      } else {
        const data = await response.json().catch(() => ({}));
        toast({ title: "Error", description: data.error || "Failed to update lead", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to connect to the server", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <DashboardSkeleton />
      </div>
    );
  }

  console.log(parseBoldSectionsToObject(lead.summary || ""));

  if (isError) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-lg font-semibold mb-2">Failed to load lead</h2>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred"}
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Lead not found</h2>
          <p className="text-muted-foreground">
            The lead you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  const status = getLeadStatus(lead);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold tracking-tight">
          {lead.first_name} {lead.last_name}
        </h2>
        <Badge className={cn("text-xs", status.color)} variant={status.variant}>
          {status.label}
        </Badge>
        {!lead.booked_at && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAsBooked}
            disabled={isBooking}
            className="ml-1"
          >
            <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
            {isBooking ? "Booking..." : "Mark as Booked"}
          </Button>
        )}
      </div>
      {lead.email && (
        <p className="text-sm text-muted-foreground -mt-2">{lead.email}</p>
      )}

      {/* Sales Tracking */}
      <Card className="flex flex-col mt-2">
        <CardHeader>
          <CardTitle>Sales Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Score */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5" />
                Score
              </label>
              <Select
                value={lead.score != null ? String(lead.score) : "none"}
                onValueChange={(val) =>
                  patchLead(
                    { score: val === "none" ? null : Number(val) },
                    val === "none" ? "Score cleared" : `Score set to ${val}`
                  )
                }
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Not scored" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not scored</SelectItem>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contract Value */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Contract Value
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={contractInput}
                  onChange={(e) => setContractInput(e.target.value)}
                  onFocus={() =>
                    setContractInput(
                      lead.contract_value != null ? String(lead.contract_value) : ""
                    )
                  }
                  onBlur={() => {
                    const num = contractInput === "" ? null : Number(contractInput);
                    if (num !== lead.contract_value) {
                      patchLead(
                        { contract_value: num },
                        num == null ? "Contract value cleared" : `Contract value set to $${num}`
                      );
                    }
                    setContractInput("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  disabled={isSaving}
                />
              </div>
              {lead.contract_value != null && !contractInput && (
                <p className="text-sm text-muted-foreground">
                  ${lead.contract_value.toLocaleString()}
                </p>
              )}
            </div>

            {/* Closed */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5" />
                Closed
              </label>
              {lead.closed_at ? (
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="bg-stage-booked text-white">
                    Closed {formatDate(lead.closed_at)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => patchLead({ closed_at: null }, "Closed date cleared")}
                    disabled={isSaving}
                  >
                    Clear
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    patchLead(
                      { closed_at: new Date().toISOString() },
                      "Lead marked as closed"
                    )
                  }
                  disabled={isSaving}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                  Mark as Closed
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Section - full width */}
      <Card className="flex flex-col mt-2">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {lead.summary ? (
            <div
              className="prose prose-sm dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: lead.summary }}
            />
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No summary
            </div>
          )}
        </CardContent>
      </Card>

      {/* Q&A Section */}
      {lead.questions_and_answers && lead.questions_and_answers.length > 0 && (
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Questions & Answers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lead.questions_and_answers
                .sort((a, b) => a.position - b.position)
                .map((qa, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium">{qa.question}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {qa.answer}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
