import { useForm, useFieldArray } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateSession } from "@/hooks/useAdvisorySessions";

const actionItemSchema = z.object({
  task: z.string().min(1, "Task is required"),
  owner: z.string().optional(),
  due_date: z.string().optional(),
  completed: z.boolean().default(false),
});

const schema = z.object({
  session_date: z.string().min(1, "Session date is required"),
  fathom_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  bottleneck_identified: z.string().optional(),
  summary: z.string().optional(),
  action_items: z.array(actionItemSchema),
});

type FormValues = z.infer<typeof schema>;

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export default function CreateSessionDialog({
  open,
  onOpenChange,
  clientId,
}: CreateSessionDialogProps) {
  const { toast } = useToast();
  const createSession = useCreateSession();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      session_date: new Date().toISOString().slice(0, 10),
      fathom_url: "",
      bottleneck_identified: "",
      summary: "",
      action_items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "action_items",
  });

  const onSubmit = async (data: FormValues) => {
    try {
      await createSession.mutateAsync({
        ...data,
        client_id: clientId,
      });
      toast({ title: "Success", description: "Session logged" });
      reset();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create session",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Log Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label htmlFor="session_date">Session Date *</Label>
            <Input id="session_date" type="date" {...register("session_date")} />
            {errors.session_date && (
              <p className="text-xs text-destructive">{errors.session_date.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fathom_url">Fathom URL</Label>
            <Input id="fathom_url" type="url" {...register("fathom_url")} placeholder="https://..." />
            {errors.fathom_url && (
              <p className="text-xs text-destructive">{errors.fathom_url.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bottleneck_identified">Bottleneck Identified</Label>
            <Input id="bottleneck_identified" {...register("bottleneck_identified")} placeholder="What's holding them back?" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea id="summary" {...register("summary")} placeholder="Session notes..." />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Action Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ task: "", owner: "", due_date: "", completed: false })}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={false}
                    {...register(`action_items.${index}.completed`)}
                  />
                  <Input
                    {...register(`action_items.${index}.task`)}
                    placeholder="Task description"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    {...register(`action_items.${index}.owner`)}
                    placeholder="Owner"
                  />
                  <Input
                    type="date"
                    {...register(`action_items.${index}.due_date`)}
                  />
                </div>
                {errors.action_items?.[index]?.task && (
                  <p className="text-xs text-destructive">
                    {errors.action_items[index].task?.message}
                  </p>
                )}
              </div>
            ))}
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
              {isSubmitting ? "Saving..." : "Log Session"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
