import AITokenCard from "./AITokenCard";

interface AIModelsSectionProps {
  openaiToken: string;
  savedOpenaiToken: string;
  isSavingOpenai: boolean;
  onOpenaiTokenChange: (value: string) => void;
  onSaveOpenai: () => void;

  claudeToken: string;
  savedClaudeToken: string;
  isSavingClaude: boolean;
  onClaudeTokenChange: (value: string) => void;
  onSaveClaude: () => void;

  geminiToken: string;
  savedGeminiToken: string;
  isSavingGemini: boolean;
  onGeminiTokenChange: (value: string) => void;
  onSaveGemini: () => void;
}

export default function AIModelsSection({
  openaiToken,
  savedOpenaiToken,
  isSavingOpenai,
  onOpenaiTokenChange,
  onSaveOpenai,
  claudeToken,
  savedClaudeToken,
  isSavingClaude,
  onClaudeTokenChange,
  onSaveClaude,
  geminiToken,
  savedGeminiToken,
  isSavingGemini,
  onGeminiTokenChange,
  onSaveGemini,
}: AIModelsSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">AI Models</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <AITokenCard
          title="OpenAI"
          description="Custom key for lead qualification"
          inputId="openai-token"
          placeholder="sk-..."
          token={openaiToken}
          savedToken={savedOpenaiToken}
          isSaving={isSavingOpenai}
          onTokenChange={onOpenaiTokenChange}
          onSave={onSaveOpenai}
        />
        <AITokenCard
          title="Claude"
          description="Custom key for AI-powered features"
          inputId="claude-token"
          placeholder="sk-ant-..."
          token={claudeToken}
          savedToken={savedClaudeToken}
          isSaving={isSavingClaude}
          onTokenChange={onClaudeTokenChange}
          onSave={onSaveClaude}
        />
        <AITokenCard
          title="Gemini"
          description="Custom key for AI-powered features"
          inputId="gemini-token"
          placeholder="AIza..."
          token={geminiToken}
          savedToken={savedGeminiToken}
          isSaving={isSavingGemini}
          onTokenChange={onGeminiTokenChange}
          onSave={onSaveGemini}
        />
      </div>
    </section>
  );
}
