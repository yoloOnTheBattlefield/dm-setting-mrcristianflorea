import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ApiLead } from "@/lib/types";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { AlertCircle, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

// Dummy chat messages
const dummyMessages = [
  {
    id: 1,
    sender: "me",
    text: "Hi! I saw you were interested in our services. How can I help you today?",
    timestamp: "2:30 PM",
  },
  {
    id: 2,
    sender: "lead",
    text: "Yes, I'd like to learn more about your pricing plans.",
    timestamp: "2:32 PM",
  },
  {
    id: 3,
    sender: "me",
    text: "Great! We have several options available. Can you tell me more about your needs?",
    timestamp: "2:33 PM",
  },
  {
    id: 4,
    sender: "lead",
    text: "I'm looking for something that can handle about 100 users.",
    timestamp: "2:35 PM",
  },
  {
    id: 5,
    sender: "me",
    text: "Perfect! Our Business plan would be ideal for that. Would you like to schedule a demo?",
    timestamp: "2:36 PM",
  },
  {
    id: 6,
    sender: "lead",
    text: "Sure, that sounds good. When are you available?",
    timestamp: "2:38 PM",
  },
];

export default function LeadDetail() {
  const { contactId } = useParams<{ contactId: string }>();

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

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <DashboardSkeleton />
      </div>
    );
  }

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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          {lead.first_name} {lead.last_name}
        </h2>
        {lead.email && (
          <p className="text-sm text-muted-foreground mt-1">{lead.email}</p>
        )}
        <p className="text-muted-foreground mt-2">Lead details and timeline</p>
      </div>

      {/* Chat and Summary Section */}
      <div className="grid gap-4 lg:grid-cols-2 mt-4">
        {/* Chat Interface */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col flex-1 p-0">
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 py-4">
                {dummyMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex flex-col gap-1",
                      message.sender === "me" ? "items-end" : "items-start",
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[80%]",
                        message.sender === "me"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                      )}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input placeholder="Type a message..." />
                <Button size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Box */}
        <Card className="flex flex-col h-[600px]">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {lead.summary ? (
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: lead.summary }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No summary
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
