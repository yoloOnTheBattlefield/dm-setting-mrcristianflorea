import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface AITokenCardProps {
  title: string;
  description: string;
  inputId: string;
  placeholder: string;
  token: string;
  savedToken: string;
  isSaving: boolean;
  onTokenChange: (value: string) => void;
  onSave: () => void;
}

export default function AITokenCard({
  title,
  description,
  inputId,
  placeholder,
  token,
  savedToken,
  isSaving,
  onTokenChange,
  onSave,
}: AITokenCardProps) {
  const hasChanged = token.trim() !== savedToken;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {savedToken ? (
            <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground gap-1">
              Server Default
            </Badge>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor={inputId}>API Key</Label>
          <Input
            id={inputId}
            type="password"
            placeholder={placeholder}
            value={token}
            onChange={(e) => onTokenChange(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !hasChanged}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
