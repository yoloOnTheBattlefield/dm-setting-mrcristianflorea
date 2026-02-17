import type {
  ResearchCompetitor,
  ResearchPost,
  ResearchKeyword,
  ResearchCommenter,
  ThemeCluster,
  LeadMagnet,
  IdeaItem,
  ResearchAlert,
  ResearchOverviewKPIs,
  EngagementTrendPoint,
} from "./research-types";

// ── Helpers ──────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

function isoDate(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

let idCounter = 0;
function uid() {
  return `r-${++idCounter}`;
}

// ── Constants ────────────────────────────────────────────────────────────

const HANDLES = [
  "realestatedubai", "fitcoachpro", "closerscript", "saaspreneurs",
  "luxurylistings_", "mindsetmogul", "scalewithai", "bizhackers",
];

const TOPIC_TAGS = [
  "sales", "mindset", "how-to", "social-proof", "controversy",
  "behind-the-scenes", "lifestyle", "tutorial", "case-study", "motivation",
];

const HOOK_PATTERNS = [
  "If you're a {X}, stop scrolling",
  "3 mistakes killing your {X}",
  "I tried {X} for 30 days — here's what happened",
  "Stop doing this if you want {X}",
  "The {X} nobody talks about",
  "Here's why {X} doesn't work anymore",
  "This one trick changed my {X}",
  "{X} secrets the top 1% know",
  "POV: You finally figured out {X}",
  "Nobody will tell you this about {X}",
];

const CTA_KEYWORDS = [
  "GUIDE", "LIST", "PDF", "FREE", "SCRIPT", "TEMPLATE",
  "CHECKLIST", "PLAYBOOK", "BLUEPRINT", "SYSTEM",
];

const COMMENT_PHRASES_MAP: Record<string, string[]> = {
  GUIDE: ["GUIDE", "guide please", "send me the guide", "GUIDE 🙏", "need the guide"],
  LIST: ["LIST", "list please", "send me the list", "LIST 🔥", "I need the list"],
  PDF: ["PDF", "pdf please", "send the pdf", "PDF 📄", "want the pdf"],
  FREE: ["FREE", "free please", "I want the free one", "FREE 🙌"],
  SCRIPT: ["SCRIPT", "script please", "send me the script", "SCRIPT 📝"],
  TEMPLATE: ["TEMPLATE", "template pls", "send template", "TEMPLATE 🙏"],
  CHECKLIST: ["CHECKLIST", "checklist please", "send checklist"],
  PLAYBOOK: ["PLAYBOOK", "playbook please", "send the playbook"],
  BLUEPRINT: ["BLUEPRINT", "blueprint pls", "need the blueprint"],
  SYSTEM: ["SYSTEM", "system please", "send the system"],
};

const USERNAMES = [
  "jake.hustle", "maria_builds", "nomadceo", "alexcloser", "ryanflips",
  "sarahscales", "devontheseller", "ellamindset", "coaching_king", "growthhacker99",
  "realestatejoe", "aileads", "contentqueen_", "closermike", "bizhustler",
  "sidehustledan", "marketingmaya", "fitpreneurlee", "digitalnomad.co", "salesacademy_",
  "wealthcoach_", "startupsteve", "affiliatepro", "ecomdan_", "ppcnerd",
  "socialmediajay", "theclosergirl", "brandbuilder_", "emailmarketer_", "seoking99",
  "funnelpro_", "webinarboss", "podcasthustler", "freelancelife_", "va_business",
  "coursecreator_", "consultingjoe", "taxstrategist", "cryptotrader_", "realtormike",
  "luxuryagent_", "investorjane", "biztips101", "growthmindset_", "dadjokes_ceo",
  "themoneyguy", "salestips_", "leadgenmaster", "conversionpro", "clickfunnelking",
];

// ── Generators ───────────────────────────────────────────────────────────

function generateCompetitors(): ResearchCompetitor[] {
  return HANDLES.map((handle) => ({
    id: uid(),
    handle,
    followers: randomInt(12_000, 950_000),
    postsTracked: randomInt(15, 80),
    avgComments: randomInt(40, 320),
    leadMagnetHitRate: randomFloat(0.08, 0.45),
    topKeyword: pick(CTA_KEYWORDS),
    lastPost: isoDate(randomInt(0, 4)),
    trackingStatus: pick(["active", "active", "active", "paused"]) as ResearchCompetitor["trackingStatus"],
  }));
}

function generatePosts(competitors: ResearchCompetitor[]): ResearchPost[] {
  const posts: ResearchPost[] = [];
  for (let i = 0; i < 120; i++) {
    const comp = pick(competitors);
    const hasLM = Math.random() < 0.35;
    const ctaKw = hasLM ? pick(CTA_KEYWORDS) : undefined;
    const commentsCount = randomInt(20, 600);
    const kwCount = ctaKw ? Math.round(commentsCount * randomFloat(0.1, 0.45)) : 0;
    const otherCount = commentsCount - kwCount;

    const distribution: ResearchPost["keywordDistribution"] = [];
    if (ctaKw) distribution.push({ keyword: ctaKw, count: kwCount });
    if (otherCount > 0) distribution.push({ keyword: "other", count: otherCount });

    posts.push({
      id: uid(),
      competitorId: comp.id,
      competitorHandle: comp.handle,
      postType: pick(["reel", "reel", "carousel", "image"]),
      caption: `${pick(HOOK_PATTERNS).replace("{X}", pick(TOPIC_TAGS))}\n\nComment "${ctaKw || "YES"}" below and I'll send it to you! 🔥\n\n#${pick(TOPIC_TAGS)} #growth #instagram`,
      hookPattern: pick(HOOK_PATTERNS),
      ctaType: hasLM ? "comment_keyword" : pick(["link_in_bio", "dm_me", "save_this", "none"]),
      ctaKeyword: ctaKw,
      topicTags: pickN(TOPIC_TAGS, randomInt(1, 3)),
      hookStyle: pick(["question", "bold_claim", "story", "statistic", "curiosity_gap", "listicle"]),
      hasLeadMagnetKeyword: hasLM,
      leadMagnetKeyword: ctaKw,
      commentsCount,
      likesCount: randomInt(200, 15_000),
      postedAt: isoDate(randomInt(0, 60)),
      keywordDistribution: distribution,
    });
  }
  return posts;
}

function generateKeywords(posts: ResearchPost[], competitors: ResearchCompetitor[]): ResearchKeyword[] {
  const kwMap = new Map<string, { posts: Set<string>; competitors: Set<string>; mentions: number }>();

  for (const post of posts) {
    for (const kd of post.keywordDistribution) {
      if (kd.keyword === "other") continue;
      if (!kwMap.has(kd.keyword)) {
        kwMap.set(kd.keyword, { posts: new Set(), competitors: new Set(), mentions: 0 });
      }
      const entry = kwMap.get(kd.keyword)!;
      entry.posts.add(post.id);
      entry.competitors.add(post.competitorHandle);
      entry.mentions += kd.count;
    }
  }

  // Add some extra keywords that appear organically
  const extras = ["DM me", "how much", "what city", "link?", "price?", "interested", "where", "info"];
  for (const kw of extras) {
    kwMap.set(kw, {
      posts: new Set(pickN(posts, randomInt(3, 12)).map((p) => p.id)),
      competitors: new Set(pickN(competitors, randomInt(2, 5)).map((c) => c.handle)),
      mentions: randomInt(30, 400),
    });
  }

  return Array.from(kwMap.entries()).map(([keyword, data]) => ({
    id: uid(),
    keyword,
    totalMentions: data.mentions,
    postsUsingIt: data.posts.size,
    competitorsUsingIt: data.competitors.size,
    competitorHandles: Array.from(data.competitors),
    firstSeen: isoDate(randomInt(30, 90)),
    lastSeen: isoDate(randomInt(0, 5)),
    trend: pick(["rising", "rising", "flat", "flat", "falling"]) as ResearchKeyword["trend"],
    weeklyMentions: Array.from({ length: 8 }, () => randomInt(5, Math.max(10, Math.round(data.mentions / 4)))),
  }));
}

function generateCommenters(competitors: ResearchCompetitor[], keywords: ResearchKeyword[]): ResearchCommenter[] {
  return Array.from({ length: 50 }, () => ({
    id: uid(),
    username: pick(USERNAMES),
    commentCount: randomInt(3, 45),
    keywordsUsed: pickN(keywords.map((k) => k.keyword), randomInt(1, 4)),
    mostCommentedCompetitor: pick(competitors).handle,
    lastActivity: isoDate(randomInt(0, 14)),
  }));
}

function generateThemeClusters(posts: ResearchPost[]): ThemeCluster[] {
  const clusters: { intent: string; label: string; comments: string[]; color: string }[] = [
    {
      intent: "pricing_questions",
      label: "Pricing Questions",
      comments: [
        "How much does this cost?",
        "What's the price for coaching?",
        "Is there a payment plan?",
        "Do you have a free option?",
        "What's your monthly rate?",
      ],
      color: "orange",
    },
    {
      intent: "how_to_start",
      label: "How Do I Start",
      comments: [
        "Where do I even begin?",
        "I'm a complete beginner, help!",
        "What's the first step?",
        "How do I get started with this?",
        "Can a newbie do this?",
      ],
      color: "blue",
    },
    {
      intent: "tool_requests",
      label: "Tool Requests",
      comments: [
        "What tool do you use for this?",
        "What software is that?",
        "Can you share the app name?",
        "What CRM do you recommend?",
        "Which scheduling tool?",
      ],
      color: "purple",
    },
    {
      intent: "location_questions",
      label: "Location Questions",
      comments: [
        "What city is this?",
        "Are you based in Dubai?",
        "Do you work with people in the US?",
        "Is this available in Europe?",
        "Where are you located?",
      ],
      color: "green",
    },
    {
      intent: "send_lead_magnet",
      label: "Send Me The Guide",
      comments: [
        "GUIDE 🙏",
        "Send me the PDF please!",
        "I need this template!",
        "DM me the checklist",
        "SCRIPT please!!",
      ],
      color: "red",
    },
    {
      intent: "social_proof",
      label: "Results & Social Proof",
      comments: [
        "This actually works, I tried it!",
        "I made my first $1K using this",
        "Best advice I've seen all week",
        "Implemented this and got 3 calls booked",
        "Following your method — up 40% this month",
      ],
      color: "emerald",
    },
  ];

  return clusters.map((c) => ({
    id: uid(),
    intent: c.intent,
    label: c.label,
    totalComments: randomInt(80, 500),
    exampleComments: c.comments,
    topTriggeringPosts: pickN(posts, 3).map((p) => ({
      postId: p.id,
      competitorHandle: p.competitorHandle,
      caption: p.caption.slice(0, 100),
    })),
  }));
}

function generateLeadMagnets(competitors: ResearchCompetitor[]): LeadMagnet[] {
  const offerTypes: LeadMagnet["offerType"][] = [
    "guide", "template", "checklist", "webinar", "free_call", "script",
  ];
  return Array.from({ length: 15 }, () => {
    const comp = pick(competitors);
    return {
      id: uid(),
      brand: comp.handle,
      isCompetitor: true,
      keyword: pick(CTA_KEYWORDS),
      offerType: pick(offerTypes),
      topic: pick(TOPIC_TAGS),
      dateDetected: isoDate(randomInt(1, 45)),
      notes: `Detected via comment keyword pattern on @${comp.handle}`,
      postsUsing: randomInt(2, 12),
      avgCommentsPerPost: randomInt(60, 350),
      keywordRepetitionRate: randomFloat(0.12, 0.48),
      isActive: Math.random() > 0.2,
    };
  });
}

function generateIdeas(posts: ResearchPost[]): IdeaItem[] {
  const categories: IdeaItem["category"][] = [
    "hooks", "lead_magnets", "angles", "caption_structures", "cta_scripts", "comment_topics",
  ];
  const statuses: IdeaItem["status"][] = ["planned", "planned", "planned", "filmed", "posted"];

  return Array.from({ length: 20 }, () => {
    const post = pick(posts);
    const status = pick(statuses);
    return {
      id: uid(),
      category: pick(categories),
      sourcePostId: post.id,
      sourceCompetitorHandle: post.competitorHandle,
      title: post.hookPattern.replace("{X}", pick(TOPIC_TAGS)),
      whyItWorked: `High engagement (${post.commentsCount} comments) with ${post.hookStyle} hook and ${post.ctaType} CTA`,
      suggestedRewrite: `Adapt for your niche: "${post.hookPattern.replace("{X}", "your topic")}"`,
      status,
      ...(status === "posted"
        ? {
            postedDate: isoDate(randomInt(1, 14)),
            views: randomInt(1_000, 50_000),
            comments: randomInt(20, 300),
            keywordCount: randomInt(5, 80),
          }
        : {}),
    };
  });
}

function generateAlerts(): ResearchAlert[] {
  const types: ResearchAlert["type"][] = [
    "new_lead_magnet", "keyword_spike", "competitor_keyword_post", "new_theme_cluster",
  ];
  const templates: Record<ResearchAlert["type"], { title: string; desc: string }[]> = {
    new_lead_magnet: [
      { title: "New lead magnet: BLUEPRINT", desc: "@fitcoachpro started using 'BLUEPRINT' as a comment keyword CTA" },
      { title: "New lead magnet: SYSTEM", desc: "@saaspreneurs launched a new 'SYSTEM' comment funnel" },
    ],
    keyword_spike: [
      { title: "Keyword spike: GUIDE", desc: "'GUIDE' mentions up 3.2x vs last 7 days across 4 competitors" },
      { title: "Keyword spike: how much", desc: "'how much' comments spiked 2.5x — pricing interest rising" },
    ],
    competitor_keyword_post: [
      { title: "@closerscript posted a reel with 'SCRIPT' CTA", desc: "New reel detected with comment-to-DM funnel. 180 keyword comments in 4h." },
      { title: "@bizhackers posted carousel with 'TEMPLATE'", desc: "Carousel post using 'Comment TEMPLATE' CTA. Already at 95 keyword comments." },
    ],
    new_theme_cluster: [
      { title: "New theme: AI tool requests", desc: "A new cluster of comments asking about AI tools has emerged across 3 competitors" },
      { title: "New theme: Payment plan questions", desc: "Increasing comments about payment plans and financing options" },
    ],
  };

  return Array.from({ length: 12 }, (_, i) => {
    const type = pick(types);
    const template = pick(templates[type]);
    return {
      id: uid(),
      type,
      title: template.title,
      description: template.desc,
      createdAt: isoDate(randomInt(0, 14)),
      isRead: i > 4,
    };
  });
}

function generateOverviewKPIs(): ResearchOverviewKPIs {
  return {
    postsTracked: randomInt(280, 450),
    commentsAnalyzed: randomInt(12_000, 35_000),
    uniqueCommenters: randomInt(4_000, 12_000),
    keywordSpikes: randomInt(3, 8),
    leadMagnetPosts: randomInt(30, 80),
    newPostsSinceLogin: randomInt(5, 25),
  };
}

function generateEngagementTrend(competitors: ResearchCompetitor[]): EngagementTrendPoint[] {
  const points: EngagementTrendPoint[] = [];
  const handles = competitors.slice(0, 4).map((c) => c.handle);
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const point: EngagementTrendPoint = {
      date: d.toISOString().slice(0, 10),
    };
    for (const h of handles) {
      point[h] = randomInt(40, 400);
    }
    points.push(point);
  }
  return points;
}

// ── Cached exports (generated once) ─────────────────────────────────────

export const COMPETITORS = generateCompetitors();
export const POSTS = generatePosts(COMPETITORS);
export const KEYWORDS = generateKeywords(POSTS, COMPETITORS);
export const COMMENTERS = generateCommenters(COMPETITORS, KEYWORDS);
export const THEME_CLUSTERS = generateThemeClusters(POSTS);
export const LEAD_MAGNETS = generateLeadMagnets(COMPETITORS);
export const IDEAS = generateIdeas(POSTS);
export const ALERTS = generateAlerts();
export const OVERVIEW_KPIS = generateOverviewKPIs();
export const ENGAGEMENT_TREND = generateEngagementTrend(COMPETITORS);

// Top posts for overview (sorted by comments)
export const TOP_POSTS = [...POSTS].sort((a, b) => b.commentsCount - a.commentsCount).slice(0, 10);
