import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  usePrompts,
  useCreatePrompt,
  useUpdatePrompt,
  useDeletePrompt,
  DEFAULT_FILTERS,
  type Prompt,
  type PromptFilters,
} from "@/hooks/usePrompts";
import { Plus, Pencil, Trash2, Check } from "lucide-react";

export default function Prompts() {
  const { user } = useAuth();
  const { toast } = useToast();


  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [formData, setFormData] = useState({
    label: "",
    promptText: "",
    isDefault: false,
    filters: { ...DEFAULT_FILTERS },
  });

  const { data: prompts = [], isLoading } = usePrompts();
  const createMutation = useCreatePrompt();
  const updateMutation = useUpdatePrompt();
  const deleteMutation = useDeletePrompt();

  const emptyForm = { label: "", promptText: "", isDefault: false, filters: { ...DEFAULT_FILTERS } };

  const openCreate = () => {
    setEditingPrompt(null);
    setFormData(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setFormData({
      label: prompt.label,
      promptText: prompt.promptText,
      isDefault: prompt.isDefault,
      filters: { ...DEFAULT_FILTERS, ...prompt.filters },
    });
    setDialogOpen(true);
  };

  const updateFilter = <K extends keyof PromptFilters>(key: K, value: PromptFilters[K]) => {
    setFormData((prev) => ({ ...prev, filters: { ...prev.filters, [key]: value } }));
  };

  const handleSubmit = async () => {
    try {
      const { filters, ...rest } = formData;
      if (editingPrompt) {
        await updateMutation.mutateAsync({
          id: editingPrompt._id,
          body: { ...rest, filters },
        });
        toast({ title: "Success", description: "Prompt updated" });
      } else {
        await createMutation.mutateAsync({
          ...rest,
          filters,
        });
        toast({ title: "Success", description: "Prompt created" });
      }
      setDialogOpen(false);
      setEditingPrompt(null);
      setFormData(emptyForm);
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

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
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
              setFormData(emptyForm);
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

                {/* Filters */}
                <div className="space-y-3 pt-2 border-t">
                  <Label className="text-sm font-medium">Lead Filters</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="filter-minFollowers" className="text-xs text-muted-foreground">
                        Min Followers
                      </Label>
                      <Input
                        id="filter-minFollowers"
                        type="number"
                        min={0}
                        value={formData.filters.minFollowers}
                        onChange={(e) => updateFilter("minFollowers", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="filter-minPosts" className="text-xs text-muted-foreground">
                        Min Posts
                      </Label>
                      <Input
                        id="filter-minPosts"
                        type="number"
                        min={0}
                        value={formData.filters.minPosts}
                        onChange={(e) => updateFilter("minPosts", Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="filter-excludePrivate" className="text-xs text-muted-foreground">
                        Exclude private accounts
                      </Label>
                      <Switch
                        id="filter-excludePrivate"
                        checked={formData.filters.excludePrivate}
                        onCheckedChange={(v) => updateFilter("excludePrivate", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="filter-verifiedOnly" className="text-xs text-muted-foreground">
                        Verified only
                      </Label>
                      <Switch
                        id="filter-verifiedOnly"
                        checked={formData.filters.verifiedOnly}
                        onCheckedChange={(v) => updateFilter("verifiedOnly", v)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="filter-bioRequired" className="text-xs text-muted-foreground">
                        Bio required
                      </Label>
                      <Switch
                        id="filter-bioRequired"
                        checked={formData.filters.bioRequired}
                        onCheckedChange={(v) => updateFilter("bioRequired", v)}
                      />
                    </div>
                  </div>
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
