import { useState } from "react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Pencil, Trash2, Heart, MapPin, DollarSign, Inbox, Briefcase } from "lucide-react";
import { useJobs, type Job } from "@/lib/jobs-store";
import { JobFormDialog } from "./JobFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Props = { jobs: Job[]; emptyHint?: string };

export function JobsTable({ jobs, emptyHint = "No jobs found." }: Props) {
  const { updateJob, deleteJob, toggleSaved } = useJobs();
  const [editing, setEditing] = useState<Job | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (jobs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">No jobs found</p>
        <p className="text-xs text-muted-foreground mt-1">{emptyHint}</p>
      </div>
    );
  }

  const handleToggleSave = async (job: Job) => {
    const wasSaved = !!job.saved;
    setBusyId(job.id);
    try {
      await toggleSaved(job.id, wasSaved);
      toast.success(wasSaved ? "Removed from saved" : "Added to saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update saved jobs");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Job</TableHead>
              <TableHead className="hidden sm:table-cell">Salary</TableHead>
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="hidden md:table-cell">Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id} className="animate-fade-in transition-colors hover:bg-muted/40">
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{job.title}</span>
                      {job.saved && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Heart className="h-3 w-3 fill-primary text-primary" /> Saved
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{job.company}</span>
                    <div className="flex flex-wrap gap-3 md:hidden mt-1 text-xs text-muted-foreground">
                      {job.salary && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary}</span>}
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{job.job_type}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-sm">{job.salary || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{job.location}</TableCell>
                <TableCell className="hidden md:table-cell text-sm">
                  <Badge variant="outline">{job.job_type}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-accent transition-colors"
                          disabled={busyId === job.id}
                          onClick={() => handleToggleSave(job)}
                          aria-label={job.saved ? "Unsave job" : "Save job"}
                        >
                          <Heart
                            key={String(job.saved)}
                            className={`h-4 w-4 transition-all duration-200 animate-heart-pop ${job.saved ? "fill-primary text-primary scale-110" : "text-muted-foreground"}`}
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{job.saved ? "Unsave" : "Save"}</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors" onClick={() => setEditing(job)} aria-label="Edit job">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 transition-colors" onClick={() => setDeleteId(job.id)} aria-label="Delete job">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <JobFormDialog
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        initial={editing}
        onSubmit={async (data) => {
          if (!editing) return;
          try {
            await updateJob(editing.id, data);
            toast.success("Job updated");
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to update job");
          }
        }}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                const id = deleteId;
                setDeleteId(null);
                if (!id) return;
                try {
                  await deleteJob(id);
                  toast.success("Job deleted");
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Failed to delete job");
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
