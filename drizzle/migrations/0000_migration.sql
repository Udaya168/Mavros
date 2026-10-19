CREATE TABLE public.visit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_slug text NOT NULL CHECK (char_length(project_slug) <= 100),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 5 AND 20),
  preferred_date date NOT NULL,
  consent boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.visit_requests TO anon, authenticated;
GRANT ALL ON public.visit_requests TO service_role;
ALTER TABLE public.visit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a visit" ON public.visit_requests FOR INSERT TO anon, authenticated WITH CHECK (consent = true);

CREATE TABLE public.demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 255),
  company text CHECK (char_length(company) <= 150),
  message text CHECK (char_length(message) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.demo_requests TO anon, authenticated;
GRANT ALL ON public.demo_requests TO service_role;
ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can request a demo" ON public.demo_requests FOR INSERT TO anon, authenticated WITH CHECK (true);