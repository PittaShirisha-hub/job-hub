import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious, PaginationEllipsis,
} from "@/components/ui/pagination";
import { useJobs } from "@/lib/jobs-store";
import { JobsTable } from "@/components/JobsTable";
import { JobFormDialog } from "@/components/JobFormDialog";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 5;

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  page: fallback(z.number().int().min(1).max(1000), 1).default(1),
});

export const Route = createFileRoute("/dashboard/")({
  validateSearch: zodValidator(searchSchema),
  component: JobsPage,
});

function JobsPage() {
  const { jobs, addJob, loading } = useJobs();
  const { q, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/dashboard/" });
  const [open, setOpen] = useState(false);
  const [draftQ, setDraftQ] = useState(q);

  // Debounce search input → URL
  useEffect(() => {
    const t = setTimeout(() => {
      if (draftQ !== q) {
        navigate({ search: { q: draftQ, page: 1 } });
      }
    }, 250);
    return () => clearTimeout(t);
  }, [draftQ, q, navigate]);

  // Keep input in sync if URL changes externally
  useEffect(() => { setDraftQ(q); }, [q]);

  const filtered = jobs.filter((j) => {
    const needle = q.toLowerCase().trim();
    if (!needle) return true;
    return j.title.toLowerCase().includes(needle)
      || j.company.toLowerCase().includes(needle)
      || j.location.toLowerCase().includes(needle);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageJobs = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // Snap page back if it's out of bounds
  useEffect(() => {
    if (page !== safePage) navigate({ search: { q, page: safePage } });
  }, [page, safePage, q, navigate]);

  const goToPage = (p: number) => navigate({ search: { q, page: p } });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">Manage all job listings on the platform.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-4 w-4" /> Add Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            placeholder="Search by title, company, location..."
            className="pl-9 pr-9"
            maxLength={80}
          />
          {draftQ && (
            <button
              type="button"
              onClick={() => setDraftQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "listing" : "listings"}
          {q && <> matching <span className="font-medium text-foreground">"{q}"</span></>}
        </p>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-8 w-24 hidden sm:block" />
              <Skeleton className="h-8 w-24 hidden sm:block" />
              <Skeleton className="h-8 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <JobsTable jobs={pageJobs} emptyHint={q ? "Try a different search term." : "Add your first job to get started."} />
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => { e.preventDefault(); if (safePage > 1) goToPage(safePage - 1); }}
                aria-disabled={safePage === 1}
                className={safePage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {buildPageList(safePage, totalPages).map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`e${i}`}><PaginationEllipsis /></PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === safePage}
                    onClick={(e) => { e.preventDefault(); goToPage(p); }}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              )
            )}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => { e.preventDefault(); if (safePage < totalPages) goToPage(safePage + 1); }}
                aria-disabled={safePage === totalPages}
                className={safePage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <JobFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={async (data) => {
          try {
            await addJob(data);
            toast.success("Job created");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to create job");
          }
        }}
      />
    </div>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  const pages: (number | "…")[] = [];
  const add = (p: number | "…") => pages.push(p);
  const window = 1;
  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      add(p);
    } else if (pages[pages.length - 1] !== "…") {
      add("…");
    }
  }
  return pages;
}

// Suppress unused import warning for Link in case treeshake complains
void Link;
