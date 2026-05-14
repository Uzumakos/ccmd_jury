-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'JURY');
CREATE TYPE verdict_status AS ENUM ('PENDING', 'CALCULATING', 'PUBLISHED', 'DRAW');

-- ============================================================
-- PROFILES (lié à auth.users via trigger)
-- ============================================================
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  role        user_role NOT NULL DEFAULT 'JURY',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil à chaque signup Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'JURY')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL UNIQUE,
  project_title    TEXT NOT NULL,
  description      TEXT,
  pdf_storage_path TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEMBERS
-- ============================================================
CREATE TABLE members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  email      TEXT,
  photo_url  TEXT,
  "order"    INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CRITERIA (seed uniquement, pas de CRUD UI)
-- ============================================================
CREATE TABLE criteria (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  max_score  INT NOT NULL,
  "order"    INT NOT NULL UNIQUE
);

-- ============================================================
-- EVALUATIONS
-- ============================================================
CREATE TABLE evaluations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jury_id      UUID NOT NULL REFERENCES profiles(id),
  group_id     UUID NOT NULL REFERENCES groups(id),
  total_score  INT DEFAULT 0,
  comment      TEXT,
  submitted    BOOLEAN DEFAULT FALSE,
  locked       BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (jury_id, group_id)
);

-- ============================================================
-- CRITERION SCORES
-- ============================================================
CREATE TABLE criterion_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  criterion_id  UUID NOT NULL REFERENCES criteria(id),
  score         INT NOT NULL CHECK (score >= 0),
  UNIQUE (evaluation_id, criterion_id)
);

-- ============================================================
-- MEMBER POINTS
-- ============================================================
CREATE TABLE member_points (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES members(id),
  points        INT NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 10),
  reason        VARCHAR(200),
  UNIQUE (evaluation_id, member_id)
);

-- ============================================================
-- FINAL VERDICT
-- ============================================================
CREATE TABLE final_verdict (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status           verdict_status DEFAULT 'PENDING',
  winning_group_id UUID REFERENCES groups(id),
  group_one_id     UUID NOT NULL REFERENCES groups(id),
  group_one_score  INT NOT NULL DEFAULT 0,
  group_two_id     UUID NOT NULL REFERENCES groups(id),
  group_two_score  INT NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO criteria (name, max_score, "order") VALUES
  ('Qualité de la présentation', 20, 1),
  ('Maîtrise du sujet',          20, 2),
  ('Innovation du projet',        20, 3),
  ('Faisabilité technique',       20, 4),
  ('Impact et pertinence',        20, 5)
ON CONFLICT (name) DO NOTHING;
