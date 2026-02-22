import { Users } from "lucide-react";

export default function Scraper() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-full bg-muted p-4">
        <Users className="h-10 w-10 text-muted-foreground" />
      </div>
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold">Follower Scraper</h2>
        <p className="text-muted-foreground">
          Coming soon. Use the Deep Scraper for reel-based lead generation.
        </p>
      </div>
    </div>
  );
}
