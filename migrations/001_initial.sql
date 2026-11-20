CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  email varchar(254) NOT NULL,
  password_hash text NOT NULL,
  role varchar(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  status varchar(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  theme varchar(10) NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_login_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_status_created_idx ON users (status, created_at DESC);

CREATE TABLE IF NOT EXISTS sessions (
  sid varchar NOT NULL PRIMARY KEY,
  sess json NOT NULL,
  expire timestamp(6) NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_expire_idx ON sessions (expire);

CREATE TABLE IF NOT EXISTS user_lessons (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id varchar(80) NOT NULL,
  first_visited_at timestamptz NOT NULL DEFAULT now(),
  last_visited_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  favorite boolean NOT NULL DEFAULT false,
  favorited_at timestamptz,
  PRIMARY KEY (user_id, lesson_id)
);
CREATE INDEX IF NOT EXISTS user_lessons_recent_idx ON user_lessons (user_id, last_visited_at DESC);
CREATE INDEX IF NOT EXISTS user_lessons_completed_idx ON user_lessons (lesson_id, completed_at) WHERE completed_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  total integer NOT NULL CHECK (total > 0 AND score <= total),
  answers jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(answers) = 'array'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS quiz_attempts_user_date_idx ON quiz_attempts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS simulation_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  simulation_id varchar(80) NOT NULL,
  outcome varchar(12) NOT NULL CHECK (outcome IN ('safe', 'risk', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS simulation_attempts_user_date_idx ON simulation_attempts (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_log (
  id bigserial PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES users(id),
  target_user_id uuid REFERENCES users(id),
  action varchar(80) NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_recent_idx ON admin_audit_log (created_at DESC);
