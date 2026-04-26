import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Job = {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  job_type: string;
  saved?: boolean;
};

export type JobInput = Omit<Job, "id" | "saved">;

const JOBS_KEY = ["jobs"] as const;
const SAVED_KEY = (uid: string | undefined) => ["saved_jobs", uid ?? "anon"] as const;

export function useJobs() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const jobsQuery = useQuery({
    queryKey: JOBS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("id,title,company,salary,location,job_type,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const savedQuery = useQuery({
    queryKey: SAVED_KEY(user?.id),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("saved_jobs").select("job_id");
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.job_id));
    },
  });

  const savedSet = savedQuery.data ?? new Set<string>();
  const jobs: Job[] = (jobsQuery.data ?? []).map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    salary: j.salary,
    location: j.location,
    job_type: j.job_type,
    saved: savedSet.has(j.id),
  }));

  const addJob = useMutation({
    mutationFn: async (input: JobInput) => {
      const { error } = await supabase.from("jobs").insert({
        title: input.title,
        company: input.company,
        salary: input.salary,
        location: input.location,
        job_type: input.job_type,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOBS_KEY }),
  });

  const updateJob = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<JobInput> }) => {
      const { error } = await supabase.from("jobs").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOBS_KEY }),
  });

  const deleteJob = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: JOBS_KEY }),
  });

  const toggleSaved = useMutation({
    mutationFn: async ({ id, currentlySaved }: { id: string; currentlySaved: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      if (currentlySaved) {
        const { error } = await supabase
          .from("saved_jobs")
          .delete()
          .eq("user_id", user.id)
          .eq("job_id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("saved_jobs")
          .insert({ user_id: user.id, job_id: id });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: SAVED_KEY(user?.id) }),
  });

  return {
    jobs,
    loading: jobsQuery.isLoading || (!!user && savedQuery.isLoading),
    error: jobsQuery.error,
    addJob: (input: JobInput) => addJob.mutateAsync(input),
    updateJob: (id: string, patch: Partial<JobInput>) => updateJob.mutateAsync({ id, patch }),
    deleteJob: (id: string) => deleteJob.mutateAsync(id),
    toggleSaved: (id: string, currentlySaved: boolean) =>
      toggleSaved.mutateAsync({ id, currentlySaved }),
  };
}
