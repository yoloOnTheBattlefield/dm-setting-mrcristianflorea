import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAccountMe } from "@/hooks/useAccountMe";

export function CalcomCard() {
  const { data } = useAccountMe();
  const calcom = data?.calcom;
  const connected = !!calcom?.enabled;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Cal.com</CardTitle>
          {connected ? (
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              Not Connected
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm break-all" data-testid="calcom-booking-url">
          {calcom?.booking_url || "—"}
        </p>
      </CardContent>
    </Card>
  );
}
