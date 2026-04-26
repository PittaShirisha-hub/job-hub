import { useEffect, useState } from "react";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Job, JobInput } from "@/lib/jobs-store";

const JOB_TYPES = ["Full-time", "Part-time", "Contract", "Internship", "Freelance"] as const;

const jobSchema = z.object({
  title: z.string().trim().min(2, "Title must be at least 2 characters").max(120, "Max 120 characters"),
  company: z.string().trim().min(2, "Company must be at least 2 characters").max(80, "Max 80 characters"),
  salary: z.string().trim().max(60, "Max 60 characters").optional().or(z.literal("")),
  location: z.string().trim().min(2, "Location is required").max(80, "Max 80 characters"),
  job_type: z.enum(JOB_TYPES),
});

type Errors = Partial<Record<"title" | "company" | "salary" | "location" | "job_type", string>>;

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Job | null;
  onSubmit: (data: JobInput) => void | Promise<void>;
};

export function JobFormDialog({ open, onOpenChange, initial, onSubmit }: Props) {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [salary, setSalary] = useState("");
  const [location, setLocation] = useState("");
  const [jobType, setJobType] = useState<typeof JOB_TYPES[number]>("Full-time");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setCompany(initial?.company ?? "");
      setSalary(initial?.salary ?? "");
      setLocation(initial?.location ?? "");
      setJobType((initial?.job_type as typeof JOB_TYPES[number]) ?? "Full-time");
      setErrors({});
      setSubmitting(false);
    }
  }, [open, initial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = jobSchema.safeParse({ title, company, salary, location, job_type: jobType });
    if (!result.success) {
      const fieldErrors: Errors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: result.data.title,
        company: result.data.company,
        salary: result.data.salary ?? "",
        location: result.data.location,
        job_type: result.data.job_type,
      });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = (err?: string) => (err ? "border-destructive focus-visible:ring-destructive" : "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit job" : "Add new job"}</DialogTitle>
          <DialogDescription>
            {initial ? "Update the listing details." : "Create a new job listing."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Engineer" maxLength={120} className={fieldClass(errors.title)} aria-invalid={!!errors.title} />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme Corp" maxLength={80} className={fieldClass(errors.company)} aria-invalid={!!errors.company} />
            {errors.company && <p className="text-xs text-destructive">{errors.company}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="salary">Salary</Label>
              <Input id="salary" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="$120k – $150k" maxLength={60} className={fieldClass(errors.salary)} aria-invalid={!!errors.salary} />
              {errors.salary && <p className="text-xs text-destructive">{errors.salary}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Remote" maxLength={80} className={fieldClass(errors.location)} aria-invalid={!!errors.location} />
              {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_type">Job type</Label>
            <Select value={jobType} onValueChange={(v) => setJobType(v as typeof JOB_TYPES[number])}>
              <SelectTrigger id="job_type" className={fieldClass(errors.job_type)}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.job_type && <p className="text-xs text-destructive">{errors.job_type}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button
              type="submit"
              disabled={submitting || !title.trim() || !company.trim() || !location.trim()}
              className="shadow-sm"
            >
              {submitting ? "Saving..." : initial ? "Save changes" : "Create job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
