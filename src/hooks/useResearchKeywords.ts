import { useQuery } from "@tanstack/react-query";
import { KEYWORDS, POSTS } from "@/lib/research-mock-data";
import type { KeywordDetailData } from "@/lib/research-types";

export function useResearchKeywords() {
  return useQuery({
    queryKey: ["research-keywords"],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 300));
      return KEYWORDS;
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useKeywordDetail(keywordId: string | null) {
  return useQuery<KeywordDetailData | null>({
    queryKey: ["research-keyword-detail", keywordId],
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 250));
      const keyword = KEYWORDS.find((k) => k.id === keywordId);
      if (!keyword) return null;

      // Find posts that contain this keyword in their distribution
      const drivingPosts = POSTS.filter((p) =>
        p.keywordDistribution.some((kd) => kd.keyword === keyword.keyword),
      ).slice(0, 10);

      // Generate example comment phrases
      const basePhrases = [
        `${keyword.keyword}`,
        `${keyword.keyword} please`,
        `send me the ${keyword.keyword.toLowerCase()}`,
        `${keyword.keyword} 🙏`,
        `I need the ${keyword.keyword.toLowerCase()}`,
        `where's the ${keyword.keyword.toLowerCase()}?`,
        `DM me the ${keyword.keyword.toLowerCase()}`,
      ];

      const isLeadMagnetKeyword = ["GUIDE", "LIST", "PDF", "FREE", "SCRIPT", "TEMPLATE", "CHECKLIST", "PLAYBOOK", "BLUEPRINT", "SYSTEM"].includes(keyword.keyword);

      return {
        keyword,
        drivingPosts,
        exactPhrases: basePhrases.slice(0, 5),
        leadMagnetGuess: isLeadMagnetKeyword
          ? `This appears to be a comment-to-DM lead magnet. Competitors are offering a free ${keyword.keyword.toLowerCase()} in exchange for a comment keyword.`
          : null,
        suggestion: isLeadMagnetKeyword
          ? `Create your own ${keyword.keyword.toLowerCase()} and use "Comment '${keyword.keyword}' below" as your CTA. ${keyword.competitorsUsingIt} competitors are already using this keyword successfully.`
          : `This keyword appears in organic comments. Consider creating content that addresses "${keyword.keyword}" directly to capture this audience intent.`,
      };
    },
    enabled: !!keywordId,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
