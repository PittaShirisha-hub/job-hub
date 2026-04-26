-- Jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL DEFAULT '',
  salary TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL,
  job_type TEXT NOT NULL DEFAULT 'Full-time',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert jobs"
  ON public.jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update jobs"
  ON public.jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete jobs"
  ON public.jobs FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_set_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Saved jobs (per user)
CREATE TABLE public.saved_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE INDEX saved_jobs_user_id_idx ON public.saved_jobs(user_id);

ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved jobs"
  ON public.saved_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs for self"
  ON public.saved_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own saved jobs"
  ON public.saved_jobs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Seed demo jobs
INSERT INTO public.jobs (title, company, salary, location, job_type) VALUES
  ('Senior Frontend Engineer', 'Acme Corp', '$140k – $180k', 'Remote', 'Full-time'),
  ('Product Designer', 'Lumen', '$110k – $140k', 'Berlin, DE', 'Full-time'),
  ('Backend Engineer', 'Northwind', '$130k – $170k', 'New York, NY', 'Full-time'),
  ('DevOps Engineer', 'Vertex', '$150k – $190k', 'Remote', 'Contract');