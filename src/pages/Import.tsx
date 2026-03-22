import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportBookingsDialog } from "@/components/ImportBookingsDialog";
import { ImportPaymentsDialog } from "@/components/ImportPaymentsDialog";
import { CalendarCheck, CreditCard } from "lucide-react";

export default function Import() {
  const [calendlyOpen, setCalendlyOpen] = useState(false);
  const [stripeOpen, setStripeOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
        <p className="text-sm text-muted-foreground">
          Bring your data in from external tools
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Calendly */}
        <Card className="flex flex-col">
          <CardContent className="py-5 px-5 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Calendly</h3>
                <p className="text-[11px] text-muted-foreground">Booking exports</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4 flex-1">
              Import bookings from Calendly CSV exports. Auto-maps columns like Invitee Name, Event Date, UTM Source, and Status.
            </p>
            <Button size="sm" variant="outline" onClick={() => setCalendlyOpen(true)}>
              Import CSV
            </Button>
          </CardContent>
        </Card>

        {/* Stripe */}
        <Card className="flex flex-col">
          <CardContent className="py-5 px-5 flex flex-col flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Stripe</h3>
                <p className="text-[11px] text-muted-foreground">Payment exports</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4 flex-1">
              Import payment data from Stripe CSV exports. Matches payments to leads by email and auto-closes deals.
            </p>
            <Button size="sm" variant="outline" onClick={() => setStripeOpen(true)}>
              Import CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      <ImportBookingsDialog open={calendlyOpen} onOpenChange={setCalendlyOpen} />
      <ImportPaymentsDialog open={stripeOpen} onOpenChange={setStripeOpen} />
    </div>
  );
}
