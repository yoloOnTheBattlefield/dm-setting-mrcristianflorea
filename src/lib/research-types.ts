export interface ResearchCompetitor {
  id: string;
  handle: string;
  followers: number;
  postsTracked: number;
  avgComments: number;
  leadMagnetHitRate: number;
  topKeyword: string | null;
  lastPost: string;
  trackingStatus: "active" | "paused" | "pending";
}

export interface ResearchPost {
  id: string;
  competitorId: string;
  competitorHandle: string;
  postType: string;
  caption: string;
  hookPattern?: string | null;
  ctaType?: string | null;
  ctaKeyword?: string | null;
  topicTags: string[];
  hookStyle?: string | null;
  hasLeadMagnetKeyword: boolean;
  leadMagnetKeyword?: string | null;
  commentsCount: number;
  likesCount: number;
  playsCount?: number;
  viralityScore: number;
  postedAt: string;
  reelUrl?: string;
  keywordDistribution: { keyword: string; count: number }[];
}

export interface ResearchKeyword {
  id: string;
  keyword: string;
  totalMentions: number;
  postsUsingIt: number;
  competitorsUsingIt: number;
  competitorHandles: string[];
  firstSeen: string;
  lastSeen: string;
  trend: "rising" | "flat" | "falling";
  weeklyMentions: number[];
}

export interface ResearchCommenter {
  id: string;
  username: string;
  commentCount: number;
  keywordsUsed: string[];
  mostCommentedCompetitor: string;
  lastActivity: string;
}

export interface ThemeCluster {
  id: string;
  intent: string;
  label: string;
  totalComments: number;
  exampleComments: string[];
  topTriggeringPosts: { postId: string; competitorHandle: string; caption: string }[];
}

export interface LeadMagnet {
  id: string;
  brand: string;
  isCompetitor: boolean;
  keyword: string;
  offerType: "guide" | "template" | "checklist" | "webinar" | "free_call" | "script" | "other";
  topic: string;
  dateDetected: string;
  notes: string;
  postsUsing: number;
  avgCommentsPerPost: number;
  keywordRepetitionRate: number;
  isActive: boolean;
}

export interface IdeaItem {
  id: string;
  category: "hooks" | "lead_magnets" | "angles" | "caption_structures" | "cta_scripts" | "comment_topics";
  sourcePostId: string;
  sourceCompetitorHandle: string;
  title: string;
  whyItWorked: string;
  suggestedRewrite: string;
  status: "planned" | "filmed" | "posted";
  postedDate?: string;
  views?: number;
  comments?: number;
  keywordCount?: number;
}

export interface ResearchAlert {
  id: string;
  type: "new_lead_magnet" | "keyword_spike" | "competitor_keyword_post" | "new_theme_cluster";
  title: string;
  description: string;
  createdAt: string;
  isRead: boolean;
  relatedEntityId?: string;
}

export interface ResearchOverviewKPIs {
  postsTracked: number;
  commentsAnalyzed: number;
  uniqueCommenters: number;
  keywordSpikes: number;
  leadMagnetPosts: number;
  newPostsSinceLogin: number;
}

export interface EngagementTrendPoint {
  date: string;
  [competitorHandle: string]: number | string;
}

export interface KeywordDetailData {
  keyword: ResearchKeyword;
  drivingPosts: ResearchPost[];
  exactPhrases: string[];
  leadMagnetGuess: string | null;
  suggestion: string;
}

export type PostSortBy = "comments" | "keyword_repetition" | "newest" | "views" | "virality";
export type IdeaCategory = IdeaItem["category"];
export type AlertType = ResearchAlert["type"];
