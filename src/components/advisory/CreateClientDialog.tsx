import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCreateClient, useUpdateClient } from "@/hooks/useAdvisoryClients";
import type { AdvisoryClient, ConstraintType, ClientHealth } from "@/lib/advisory-types";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  niche: z.string().optional(),
  monthly_revenue: z.coerce.number().min(0).optional(),
  runway: z.coerce.number().min(0).optional(),
  constraint_type: z.enum(["delegation", "psychological", "conversion", "content", "systems", "ads"]).optional(),
  health: z.enum(["green", "amber", "red"]).optional(),
  next_call_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingClient?: AdvisoryClient | null;
}

export default function CreateClientDialog({
  open,
  onOpenChange,
  editingClient,
}: CreateClientDialogProps) {
  const { toast } = useToast();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const isEdit = !!editingClient;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      niche: "",
      monthly_revenue: 0,
      runway: 0,
      constraint_type: "delegation",
      health: "green",
      next_call_date: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && editingClient) {
      reset({
        name: editingClient.name,
        niche: editingClient.niche || "",
        monthly_revenue: editingClient.monthly_revenue || 0,
        runway: editingClient.runway || 0,
        constraint_type: editingClient.constraint_type || "delegation",
        health: editingClient.health || "green",
        next_call_date: editingClient.next_call_date
          ? editingClient.next_call_date.slice(0, 10)
          : "",
        notes: editingClient.notes || "",
      });
    } else if (open) {
      reset({
        name: "",
        niche: "",
        monthly_revenue: 0,
        runway: 0,
        constraint_type: "delegation",
        health: "green",
        next_call_date: "",
        notes: "",
      });
    }
  }, [open, editingClient, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateClient.mutateAsync({ id: editingClient._id, body: data as Partial<AdvisoryClient> });
        toast({ title: "Success", description: "Client updated" });
      } else {
        await createClient.mutateAsync(data as Partial<AdvisoryClient>);
        toast({ title: "Success", description: "Client created" });
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save client",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "New Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register("name")} placeholder="Client name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="niche">Niche</Label>
            <Input id="niche" {...register("niche")} placeholder="e.g. Fitness coaching" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="monthly_revenue">Monthly Revenue</Label>
              <Input id="monthly_revenue" type="number" {...register("monthly_revenue")} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="runway">Runway</Label>
              <Input id="runway" type="number" {...register("runway")} min={0} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Constraint Type</Label>
              <Select
                value={watch("constraint_type")}
                onValueChange={(v) => setValue("constraint_type", v as ConstraintType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delegation">Delegation</SelectItem>
                  <SelectItem value="psychological">Psychological</SelectItem>
                  <SelectItem value="conversion">Conversion</SelectItem>
                  <SelectItem value="content">Content</SelectItem>
                  <SelectItem value="systems">Systems</SelectItem>
                  <SelectItem value="ads">Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Health</Label>
              <Select
                value={watch("health")}
                onValueChange={(v) => setValue("health", v as ClientHealth)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="green">Healthy</SelectItem>
                  <SelectItem value="amber">At Risk</SelectItem>
                  <SelectItem value="red">Needs Attention</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="next_call_date">Next Call Date</Label>
            <Input id="next_call_date" type="date" {...register("next_call_date")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} placeholder="Optional notes..." />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
