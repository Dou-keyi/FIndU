-- Create resume_templates table
CREATE TABLE IF NOT EXISTS public.resume_templates (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  gradient text,
  accent text,
  icon text,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.resume_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read global templates (candidate_id is null) or their own templates
CREATE POLICY "Users can read global and own templates"
ON public.resume_templates FOR SELECT
TO authenticated
USING (candidate_id IS NULL OR candidate_id = auth.uid());

-- Policy: Users can insert their own templates
CREATE POLICY "Users can insert own templates"
ON public.resume_templates FOR INSERT
TO authenticated
WITH CHECK (candidate_id = auth.uid());

-- Insert default templates
INSERT INTO public.resume_templates (id, name, description, gradient, accent, icon)
VALUES 
  ('professional', 'Professional', 'Clean two-column layout with structured sections', 'from-slate-800 to-slate-600', '#334155', 'Layout'),
  ('creative', 'Creative', 'Bold colours and modern typography', 'from-violet-600 to-indigo-500', '#7c3aed', 'Palette'),
  ('minimal', 'Minimal', 'Simple, elegant and content-focused', 'from-gray-500 to-gray-400', '#6b7280', 'Minimize2')
ON CONFLICT (id) DO NOTHING;
