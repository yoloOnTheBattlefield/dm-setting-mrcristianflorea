import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KeywordRadarTable } from "@/components/research/KeywordRadarTable";
import { KeywordDetailSheet } from "@/components/research/KeywordDetailSheet";
import { CommenterTable } from "@/components/research/CommenterTable";
import { ThemeClusters } from "@/components/research/ThemeClusters";
import { useResearchKeywords, useKeywordDetail } from "@/hooks/useResearchKeywords";
import { useResearchCommenters } from "@/hooks/useResearchCommenters";
import { useResearchThemeClusters } from "@/hooks/useResearchThemeClusters";

export default function CommentsIntel() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: keywords = [], isLoading: keywordsLoading } = useResearchKeywords();
  const { data: keywordDetail, isLoading: detailLoading } = useKeywordDetail(selectedKeywordId);
  const { data: commenters = [], isLoading: commentersLoading } = useResearchCommenters();
  const { data: clusters = [], isLoading: clustersLoading } = useResearchThemeClusters();

  const handleKeywordClick = (keywordId: string) => {
    setSelectedKeywordId(keywordId);
    setSheetOpen(true);
  };

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="sticky top-16 z-40 bg-background border-b border-border">
        <div className="px-6 py-4">
          <h2 className="text-2xl font-bold tracking-tight">Comments Intel</h2>
          <p className="text-muted-foreground">Keyword radar, commenter patterns, and theme analysis</p>
        </div>
      </div>
      <div className="flex-1 p-6">
        <Tabs defaultValue="keywords">
          <TabsList>
            <TabsTrigger value="keywords">Keyword Radar</TabsTrigger>
            <TabsTrigger value="commenters">Commenter List</TabsTrigger>
            <TabsTrigger value="themes">Theme Clusters</TabsTrigger>
          </TabsList>

          <TabsContent value="keywords" className="mt-4">
            <KeywordRadarTable
              keywords={keywords}
              isLoading={keywordsLoading}
              onKeywordClick={handleKeywordClick}
            />
          </TabsContent>

          <TabsContent value="commenters" className="mt-4">
            <CommenterTable
              commenters={commenters}
              isLoading={commentersLoading}
            />
          </TabsContent>

          <TabsContent value="themes" className="mt-4">
            <ThemeClusters
              clusters={clusters}
              isLoading={clustersLoading}
            />
          </TabsContent>
        </Tabs>
      </div>

      <KeywordDetailSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        data={keywordDetail}
        isLoading={detailLoading}
      />
    </div>
  );
}
