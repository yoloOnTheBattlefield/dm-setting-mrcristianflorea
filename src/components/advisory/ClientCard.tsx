import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import ClientHealthBadge from "./ClientHealthBadge";
import ConstraintBadge from "./ConstraintBadge";
import type { AdvisoryClient } from "@/lib/advisory-types";

function formatCurrency(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface ClientCardProps {
  client: AdvisoryClient;
}

export default function ClientCard({ client }: ClientCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 sm:p-4 shadow-sm transition-all cursor-pointer hover:shadow-md hover:scale-[1.02]"
      )}
      onClick={() => navigate(`/advisory/clients/${client._id}`)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{client.niche}</p>
        </div>
        <ClientHealthBadge health={client.health} />
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <ConstraintBadge constraint={client.constraint_type} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <span className="text-muted-foreground">Revenue</span>
          <p className="font-medium">{formatCurrency(client.monthly_revenue)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Runway</span>
          <p className="font-medium">{formatCurrency(client.runway)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Next Call</span>
          <p className="font-medium">
            {client.next_call_date ? formatDate(client.next_call_date) : "No call scheduled"}
          </p>
        </div>
        {client.latest_session && (
          <div>
            <span className="text-muted-foreground">Last Session</span>
            <p className="font-medium">{formatDate(client.latest_session.session_date)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
