import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useJobs } from "@/lib/jobs-store";
import { JobsTable } from "@/components/JobsTable";

export const Route = createFileRoute("/dashboard/saved")({
  head: () => ({ meta: [{ title: "Saved Jobs — JobBoard Admin" }] }),
  component: SavedJobsPage,
});

function SavedJobsPage() {
  const { jobs } = useJobs();
  const saved = jobs.filter((j) => j.saved);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Heart className="h-5 w-5 fill-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Saved Jobs</h1>
            <p className="text-sm text-muted-foreground">Your bookmarked listings.</p>
          </div>
        </div>
        {saved.length > 0 && (
          <Badge variant="secondary" className="text-sm">
            {saved.length} {saved.length === 1 ? "job" : "jobs"}
          </Badge>
        )}
      </div>
      <JobsTable
        jobs={saved}
        emptyHint="Bookmark jobs from the Jobs page to see them here."
      />
    </div>
  );
}
