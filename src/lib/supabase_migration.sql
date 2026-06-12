-- ═══════════════════════════════════════════════════════════════
-- FIndU Feed — Supabase Schema Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─── 1. Extend posts table ──────────────────────────────────

DO $$ BEGIN
  CREATE TYPE post_visibility AS ENUM ('public', 'connections');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_intent AS ENUM ('hiring', 'open_to_work', 'sharing', 'asking', 'celebrating');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE post_type_enum AS ENUM ('default', 'milestone', 'poll', 'job', 'article', 'portfolio', 'candidate_spotlight', 'event', 'quote_repost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS visibility    post_visibility DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS intent        post_intent,
  ADD COLUMN IF NOT EXISTS location      text,
  ADD COLUMN IF NOT EXISTS scheduled_at  timestamptz,
  ADD COLUMN IF NOT EXISTS view_count    int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS type          post_type_enum DEFAULT 'default',
  ADD COLUMN IF NOT EXISTS quoted_post_id uuid REFERENCES posts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS thread_id     uuid,
  ADD COLUMN IF NOT EXISTS thread_index  int,
  ADD COLUMN IF NOT EXISTS media_urls    text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS media_types   text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS link_preview  jsonb;

-- ─── 2. User follows (user-to-user) ────────────────────────

CREATE TABLE IF NOT EXISTS user_follows (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- ─── 3. Post reactions ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS post_reactions (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type      text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);

-- ─── 4. Reposts ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reposts (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- ─── 5. Comments ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body       text NOT NULL,
  image_url  text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_pinned  boolean DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

-- ─── 6. Comment reactions ───────────────────────────────────

CREATE TABLE IF NOT EXISTS comment_reactions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- ─── 7. Polls ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS polls (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  question  text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS poll_options (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text     text NOT NULL,
  position int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id   uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- ─── 8. Bookmarks & Collections ────────────────────────────

CREATE TABLE IF NOT EXISTS bookmark_collections (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name      text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id       uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES bookmark_collections(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- ─── 9. Reports ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id     uuid REFERENCES posts(id) ON DELETE CASCADE,
  comment_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      text NOT NULL,
  details     text,
  created_at  timestamptz DEFAULT now()
);

-- ─── 10. User blocks / mutes ────────────────────────────────

CREATE TABLE IF NOT EXISTS user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS user_mutes (
  muter_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  muted_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  until      timestamptz,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (muter_id, muted_id)
);

CREATE TABLE IF NOT EXISTS user_muted_tags (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag     text NOT NULL,
  UNIQUE(user_id, tag)
);

CREATE TABLE IF NOT EXISTS not_interested (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  UNIQUE(user_id, post_id)
);

-- ─── 11. Event RSVPs ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_rsvps (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id   uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- ─── 12. DM schema (conversations / messages) ──────────────

CREATE TABLE IF NOT EXISTS conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            text,
  post_id         uuid REFERENCES posts(id) ON DELETE SET NULL,
  image_url       text,
  created_at      timestamptz DEFAULT now(),
  read_at         timestamptz
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

-- ─── 13. RPC: increment view count ─────────────────────────

CREATE OR REPLACE FUNCTION increment_view_count(p_post_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE posts SET view_count = view_count + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 14. Enable Realtime on key tables ──────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE posts;
ALTER PUBLICATION supabase_realtime ADD TABLE post_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE reposts;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
