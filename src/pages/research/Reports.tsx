import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Lock } from "lucide-react";

export default function Reports() {
  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex-1 p-6 space-y-6">
        {/* Generate button with coming-soon notice */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Button disabled className="gap-2">
            <FileText className="h-4 w-4" />
            Generate Weekly Report
          </Button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>
              Coming soon — reports will be generated from your tracked data
            </span>
          </div>
        </div>

        {/* Report template preview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Weekly Research Summary</CardTitle>
            <CardDescription>
              Preview of the report format that will be generated automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Key Findings */}
            <section>
              <h3 className="text-base font-semibold mb-3">Key Findings</h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>
                  Competitor @growthcoach increased keyword "FREE GUIDE" usage by
                  35% this week, appearing in 4 out of 7 new posts.
                </li>
                <li>
                  The hook pattern "Bold Claim + CTA" generated 2.4x more
                  comments than the average across all tracked competitors.
                </li>
                <li>
                  A new theme cluster around "automation tools for creators" has
                  emerged with 12 unique comments mentioning related topics.
                </li>
              </ul>
            </section>

            {/* Top Performing Keywords */}
            <section>
              <h3 className="text-base font-semibold mb-3">
                Top Performing Keywords
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { keyword: "FREE GUIDE", mentions: 47, trend: "+12%" },
                  { keyword: "DM ME", mentions: 38, trend: "+8%" },
                  { keyword: "CHECKLIST", mentions: 29, trend: "+22%" },
                  { keyword: "LINK IN BIO", mentions: 25, trend: "-3%" },
                ].map((kw) => (
                  <div
                    key={kw.keyword}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{kw.keyword}</p>
                      <p className="text-xs text-muted-foreground">
                        {kw.mentions} mentions this week
                      </p>
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        kw.trend.startsWith("+")
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {kw.trend}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Lead Magnet Opportunities */}
            <section>
              <h3 className="text-base font-semibold mb-3">
                Lead Magnet Opportunities
              </h3>
              <div className="space-y-3">
                {[
                  {
                    title: "Instagram Growth Checklist",
                    competitor: "@socialpro",
                    avgComments: 156,
                  },
                  {
                    title: "Free DM Script Template",
                    competitor: "@dmexpert",
                    avgComments: 132,
                  },
                  {
                    title: "Content Calendar Webinar",
                    competitor: "@contentlab",
                    avgComments: 98,
                  },
                ].map((lm) => (
                  <div
                    key={lm.title}
                    className="flex items-center justify-between rounded-md border px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{lm.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Seen on {lm.competitor}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ~{lm.avgComments} avg comments
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Recommended Actions */}
            <section>
              <h3 className="text-base font-semibold mb-3">
                Recommended Actions
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>
                  Create a lead magnet around "Instagram Growth Checklist" --
                  this format is driving 156 avg comments for @socialpro.
                </li>
                <li>
                  Test the "Bold Claim" hook pattern in your next 3 reels to
                  validate the 2.4x engagement lift seen in competitor data.
                </li>
                <li>
                  Monitor the "automation tools" theme cluster -- early adoption
                  of this topic could capture emerging audience interest.
                </li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
