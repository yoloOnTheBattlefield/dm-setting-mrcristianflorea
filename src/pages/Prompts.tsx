import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  usePrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  Prompt,
} from "@/hooks/usePrompts";
import { Plus, Pencil, Trash2, Check } from "lucide-react";

export default function Prompts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const accountId = user?.account_id;

  // Admin guard
  useEffect(() => {
    if (user && user.role !== 0) {
      navigate("/");
    }
  }, [user, navigate]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    promptText: "",
    isDefault: false,
  });

  const { data: prompts = [], isLoading } = usePrompts(accountId);
  const createMutation = useCreatePrompt();
  const updateMutation = useUpdatePrompt(accountId);
  const deleteMutation = useDeletePrompt(accountId);

  const openCreate = () => {
    setEditingPrompt(null);
    setFormData({ label: "", promptText: "", isDefault: false });
    setDialogOpen(true);
  };

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      label: prompt.label,
      promptText: prompt.promptText,
      isDefault: prompt.isDefault,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!accountId) {
      toast({ title: "Error", description: "Account ID not found. Try logging out and back in.", variant: "destructive" });
      return;
    }
    try {
      if (editingPrompt) {
        await updateMutation.mutateAsync({
          id: editingPrompt._id,
          body: formData,
        });
        toast({ title: "Success", description: "Prompt updated" });
      } else {
        await createMutation.mutateAsync({
          account_id: accountId,
          ...formData,
        });
        toast({ title: "Success", description: "Prompt created" });
      }
      setDialogOpen(false);
      setEditingPrompt(null);
      setFormData({ label: "", promptText: "", isDefault: false });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save prompt",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (promptId: string) => {
    try {
      await deleteMutation.mutateAsync(promptId);
      toast({ title: "Success", description: "Prompt deleted" });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete prompt",
        variant: "destructive",
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (user?.role !== 0) return null;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Prompts</h2>
        <p className="text-muted-foreground">
          Manage classification prompts for lead qualification
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Classification Prompts</CardTitle>
            <CardDescription>
              Create and manage prompts used to qualify uploaded leads
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingPrompt(null);
              setFormData({ label: "", promptText: "", isDefault: false });
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                New Prompt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingPrompt ? "Edit Prompt" : "Create Prompt"}</DialogTitle>
                <DialogDescription>
                  {editingPrompt
                    ? "Update the prompt details below."
                    : "Add a new classification prompt for lead qualification."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-label">Label</Label>
                  <Input
                    id="prompt-label"
                    placeholder="e.g. Coaching Offer"
                    value={formData.label}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, label: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-text">Prompt Text</Label>
                  <Textarea
                    id="prompt-text"
                    placeholder="You are an assistant that classifies..."
                    className="min-h-[120px]"
                    value={formData.promptText}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, promptText: e.target.value }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="prompt-default"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isDefault: !!checked }))
                    }
                  />
                  <Label htmlFor="prompt-default" className="text-sm font-normal">
                    Set as default prompt
                  </Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving || !formData.label || !formData.promptText}
                >
                  {isSaving ? "Saving..." : editingPrompt ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading prompts...</p>
          ) : prompts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No prompts yet. Create one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Label</TableHead>
                  <TableHead>Prompt Text</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prompts.map((prompt) => (
                  <TableRow key={prompt._id}>
                    <TableCell className="font-medium">{prompt.label}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-muted-foreground">
                      {prompt.promptText}
                    </TableCell>
                    <TableCell>
                      {prompt.isDefault ? (
                        <Badge variant="secondary" className="gap-1">
                          <Check className="h-3 w-3" />
                          Default
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(prompt)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete prompt?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the "{prompt.label}" prompt. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(prompt._id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
