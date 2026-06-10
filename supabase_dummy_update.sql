-- 1. Create jobs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  title text NOT NULL,
  location text,
  salary_min numeric,
  salary_max numeric,
  currency text DEFAULT 'MYR',
  work_type text,
  experience_level text,
  skills_required text[],
  description text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. Add job_id to posts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='posts' AND column_name='job_id') THEN
        ALTER TABLE public.posts ADD COLUMN job_id uuid REFERENCES public.jobs(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema='public' AND table_name='posts' AND column_name='quoted_post_id') THEN
        ALTER TABLE public.posts ADD COLUMN quoted_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Disable RLS on jobs temporarily to insert data safely
ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- 3. Get existing users and companies to use for foreign keys
DO $$
DECLARE
    u_candidate uuid;
    u_employer uuid;
    c_acme uuid;
    c_globex uuid;
    j_frontend uuid := gen_random_uuid();
    j_backend uuid := gen_random_uuid();
    j_design uuid := gen_random_uuid();
    p_job1 uuid := gen_random_uuid();
    p_job2 uuid := gen_random_uuid();
    p_job3 uuid := gen_random_uuid();
    p_poll uuid := gen_random_uuid();
    p_quote uuid := gen_random_uuid();
    existing_post_id uuid;
    c_root uuid := gen_random_uuid();
    c_reply1 uuid := gen_random_uuid();
    c_reply2 uuid := gen_random_uuid();
BEGIN
    -- Grab first candidate and employer
    SELECT id INTO u_candidate FROM profiles WHERE role = 'candidate' LIMIT 1;
    SELECT id INTO u_employer FROM profiles WHERE role = 'employer' LIMIT 1;
    
    -- Fallbacks
    IF u_candidate IS NULL THEN SELECT id INTO u_candidate FROM profiles LIMIT 1; END IF;
    IF u_employer IS NULL THEN SELECT id INTO u_employer FROM profiles LIMIT 1; END IF;

    -- Grab companies
    SELECT id INTO c_acme FROM companies ORDER BY name ASC LIMIT 1;
    SELECT id INTO c_globex FROM companies ORDER BY name DESC LIMIT 1;

    -- If no companies exist, we can't create jobs, but let's assume they do based on previous seeders.
    
    ---------------------------------------------------------
    -- INSERT JOBS
    ---------------------------------------------------------
    INSERT INTO public.jobs (id, company_id, title, location, salary_min, salary_max, work_type, experience_level, skills_required)
    VALUES 
    (j_frontend, c_acme, 'Senior Frontend Engineer', 'Kuala Lumpur, MY', 8000, 15000, 'hybrid', 'senior', ARRAY['React', 'Next.js', 'Tailwind CSS']),
    (j_backend, c_globex, 'Backend Developer (Go)', 'Remote', 6000, 12000, 'remote', 'mid', ARRAY['Golang', 'PostgreSQL', 'Docker']),
    (j_design, c_acme, 'Product Designer', 'Singapore', 10000, 18000, 'onsite', 'senior', ARRAY['Figma', 'UX Research', 'Prototyping']);

    ---------------------------------------------------------
    -- INSERT JOB POSTS
    ---------------------------------------------------------
    INSERT INTO public.posts (id, author_id, company_id, content, type, intent, job_id, created_at)
    VALUES
    (p_job1, u_employer, c_acme, 'We are expanding our engineering team! Looking for a seasoned Frontend Engineer to lead our new architecture.', 'job', 'hiring', j_frontend, now() - interval '2 hours'),
    (p_job2, u_employer, c_globex, 'Globex is going fully remote for our backend roles. Come build scalable microservices with us.', 'job', 'hiring', j_backend, now() - interval '1 day'),
    (p_job3, u_employer, c_acme, 'Our design team needs a visionary. Help us shape the future of FIndU.', 'job', 'hiring', j_design, now() - interval '3 days');

    ---------------------------------------------------------
    -- INSERT POLL POST (Bahasa Malaysia)
    ---------------------------------------------------------
    INSERT INTO public.posts (id, author_id, content, type, intent, created_at)
    VALUES
    (p_poll, u_candidate, 'Saya nampak makin banyak syarikat suruh pekerja balik ofis. Macam mana pendapat korang?', 'poll', 'asking', now() - interval '4 hours');

    INSERT INTO public.polls (id, post_id, question, expires_at)
    VALUES
    (gen_random_uuid(), p_poll, 'Remote vs Hybrid vs On-site — apa pilihan korang untuk 2026?', now() + interval '3 days');

    INSERT INTO public.poll_options (poll_id, text, position)
    VALUES
    ((SELECT id FROM polls WHERE post_id = p_poll), '100% Remote (Kerja dari rumah terus)', 0),
    ((SELECT id FROM polls WHERE post_id = p_poll), 'Hybrid (2-3 hari di ofis)', 1),
    ((SELECT id FROM polls WHERE post_id = p_poll), 'On-site penuh (Suka jumpa kawan ofis)', 2);

    ---------------------------------------------------------
    -- INSERT QUOTE REPOST (Vietnamese quoting English)
    ---------------------------------------------------------
    -- Get an existing post (prefer one with some text)
    SELECT id INTO existing_post_id FROM posts WHERE type = 'default' AND author_id != u_employer LIMIT 1;
    IF existing_post_id IS NULL THEN SELECT id INTO existing_post_id FROM posts LIMIT 1; END IF;

    IF existing_post_id IS NOT NULL THEN
        INSERT INTO public.posts (id, author_id, content, type, quoted_post_id, created_at)
        VALUES
        (p_quote, u_employer, 'Thật tuyệt vời! Chúc mừng bạn đã nhận được offer. Thị trường công nghệ năm nay đang dần khởi sắc.', 'quote_repost', existing_post_id, now() - interval '30 minutes');
    END IF;

    ---------------------------------------------------------
    -- INSERT THREADED COMMENTS (Mixed Languages)
    ---------------------------------------------------------
    -- Insert root comment on the poll post
    INSERT INTO public.comments (id, post_id, user_id, body, created_at)
    VALUES
    (c_root, p_poll, u_employer, 'Personally, hybrid is the perfect balance for deep work and collaboration.', now() - interval '3 hours');

    -- Insert reply 1 (Mandarin)
    INSERT INTO public.comments (id, post_id, parent_id, user_id, body, created_at)
    VALUES
    (c_reply1, p_poll, c_root, u_candidate, '我同意。混合办公确实提供了很大的灵活性，同时也保留了团队合作的机会。', now() - interval '2 hours');

    -- Insert reply 2 (Spanish)
    INSERT INTO public.comments (id, post_id, parent_id, user_id, body, created_at)
    VALUES
    (c_reply2, p_poll, c_root, u_employer, '¡Exactamente! Lo mejor de los dos mundos.', now() - interval '1 hour');

END $$;
