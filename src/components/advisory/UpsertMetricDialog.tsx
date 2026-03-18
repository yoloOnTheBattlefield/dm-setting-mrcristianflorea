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
import { useToast } from "@/hooks/use-toast";
import { useUpsertMetric } from "@/hooks/useAdvisoryMetrics";

const schema = z.object({
  month: z.string().min(1, "Month is required"),
  cash_collected: z.coerce.number().min(0),
  mrr: z.coerce.number().min(0),
  calls_booked: z.coerce.number().min(0),
  calls_showed: z.coerce.number().min(0),
  calls_closed: z.coerce.number().min(0),
  expenses: z.coerce.number().min(0),
});

type FormValues = z.infer<typeof schema>;

interface UpsertMetricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export default function UpsertMetricDialog({
  open,
  onOpenChange,
  clientId,
}: UpsertMetricDialogProps) {
  const { toast } = useToast();
  const upsertMetric = useUpsertMetric();

  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      month: defaultMonth,
      cash_collected: 0,
      mrr: 0,
      calls_booked: 0,
      calls_showed: 0,
      calls_closed: 0,
      expenses: 0,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await upsertMetric.mutateAsync({
        ...data,
        client_id: clientId,
      });
      toast({ title: "Success", description: "Metrics logged" });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save metrics",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Monthly Metrics</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="month">Month</Label>
            <Input id="month" type="month" {...register("month")} />
            {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="cash_collected">Cash Collected</Label>
              <Input id="cash_collected" type="number" {...register("cash_collected")} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mrr">MRR</Label>
              <Input id="mrr" type="number" {...register("mrr")} min={0} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="calls_booked">Booked</Label>
              <Input id="calls_booked" type="number" {...register("calls_booked")} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calls_showed">Showed</Label>
              <Input id="calls_showed" type="number" {...register("calls_showed")} min={0} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calls_closed">Closed</Label>
              <Input id="calls_closed" type="number" {...register("calls_closed")} min={0} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="expenses">Expenses</Label>
            <Input id="expenses" type="number" {...register("expenses")} min={0} />
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
              {isSubmitting ? "Saving..." : "Save Metrics"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
