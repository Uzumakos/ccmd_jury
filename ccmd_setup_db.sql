-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE ccmd_user_role AS ENUM ('ADMIN', 'JURY');
CREATE TYPE ccmd_verdict_status AS ENUM ('PENDING', 'CALCULATING', 'PUBLISHED', 'DRAW');

-- ============================================================
-- PROFILES (lié à auth.users via trigger)
-- ============================================================
CREATE TABLE ccmd_profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT,
  role        ccmd_user_role NOT NULL DEFAULT 'JURY',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger : crée automatiquement un profil à chaque signup Supabase Auth
CREATE OR REPLACE FUNCTION ccmd_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO ccmd_profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email, 'Utilisateur'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::ccmd_user_role, 'JURY')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER ccmd_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION ccmd_handle_new_user();

-- ============================================================
-- GROUPS
-- ============================================================
CREATE TABLE ccmd_groups (
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
CREATE TABLE ccmd_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES ccmd_groups(id) ON DELETE CASCADE,
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
CREATE TABLE ccmd_criteria (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  max_score  INT NOT NULL,
  "order"    INT NOT NULL UNIQUE
);

-- ============================================================
-- EVALUATIONS
-- ============================================================
CREATE TABLE ccmd_evaluations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jury_id      UUID NOT NULL REFERENCES ccmd_profiles(id),
  group_id     UUID NOT NULL REFERENCES ccmd_groups(id),
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
CREATE TABLE ccmd_criterion_scores (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES ccmd_evaluations(id) ON DELETE CASCADE,
  criterion_id  UUID NOT NULL REFERENCES ccmd_criteria(id),
  score         INT NOT NULL CHECK (score >= 0),
  UNIQUE (evaluation_id, criterion_id)
);

-- ============================================================
-- MEMBER POINTS
-- ============================================================
CREATE TABLE ccmd_member_points (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES ccmd_evaluations(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES ccmd_members(id),
  points        INT NOT NULL DEFAULT 0 CHECK (points >= 0 AND points <= 10),
  reason        VARCHAR(200),
  UNIQUE (evaluation_id, member_id)
);

-- ============================================================
-- FINAL VERDICT
-- ============================================================
CREATE TABLE ccmd_final_verdict (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status           ccmd_verdict_status DEFAULT 'PENDING',
  winning_group_id UUID REFERENCES ccmd_groups(id),
  group_one_id     UUID NOT NULL REFERENCES ccmd_groups(id),
  group_one_score  INT NOT NULL DEFAULT 0,
  group_two_id     UUID NOT NULL REFERENCES ccmd_groups(id),
  group_two_score  INT NOT NULL DEFAULT 0,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO ccmd_criteria (name, max_score, "order") VALUES
  ('Qualité de la présentation', 20, 1),
  ('Maîtrise du sujet',          20, 2),
  ('Innovation du projet',        20, 3),
  ('Faisabilité technique',       20, 4),
  ('Impact et pertinence',        20, 5)
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- STORAGE (BUCKETS & POLICIES)
-- ============================================================
-- Note: Buckets might need manual creation if SQL is restricted, 
-- but these commands represent the required configuration.

INSERT INTO storage.buckets (id, name, public) 
VALUES ('ccmd_documents', 'ccmd_documents', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public Read Access" 
  ON storage.objects FOR SELECT 
  TO public 
  USING (bucket_id = 'ccmd_documents');

-- Admin write access
CREATE POLICY "Admin Write Access" 
  ON storage.objects FOR INSERT 
  TO authenticated 
  WITH CHECK (
    bucket_id = 'ccmd_documents' AND 
    ccmd_is_admin(auth.uid())
  );

-- Admin delete access
CREATE POLICY "Admin Delete Access" 
  ON storage.objects FOR DELETE 
  TO authenticated 
  USING (
    bucket_id = 'ccmd_documents' AND 
    ccmd_is_admin(auth.uid())
  );

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Function to check if a user is an admin (bypasses RLS)
CREATE OR REPLACE FUNCTION ccmd_is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM ccmd_profiles
    WHERE id = user_id AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PROFILES
ALTER TABLE ccmd_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy" 
  ON ccmd_profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id OR ccmd_is_admin(auth.uid()));

CREATE POLICY "profiles_insert_policy" 
  ON ccmd_profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_policy" 
  ON ccmd_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- GROUPS
ALTER TABLE ccmd_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view groups" 
  ON ccmd_groups FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage groups" 
  ON ccmd_groups FOR ALL 
  TO authenticated 
  USING (ccmd_is_admin(auth.uid()));

-- MEMBERS
ALTER TABLE ccmd_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view members" 
  ON ccmd_members FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage members" 
  ON ccmd_members FOR ALL 
  TO authenticated 
  USING (ccmd_is_admin(auth.uid()));

-- CRITERIA
ALTER TABLE ccmd_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view criteria" 
  ON ccmd_criteria FOR SELECT 
  TO authenticated 
  USING (true);

-- EVALUATIONS
ALTER TABLE ccmd_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Juries can view their own evaluations" 
  ON ccmd_evaluations FOR SELECT 
  TO authenticated 
  USING (auth.uid() = jury_id);

CREATE POLICY "Juries can insert their own evaluations" 
  ON ccmd_evaluations FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = jury_id);

CREATE POLICY "Juries can update their own evaluations" 
  ON ccmd_evaluations FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = jury_id);

CREATE POLICY "Admins can view all evaluations" 
  ON ccmd_evaluations FOR SELECT 
  TO authenticated 
  USING (ccmd_is_admin(auth.uid()));

-- CRITERION SCORES
ALTER TABLE ccmd_criterion_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Juries can manage their own criterion scores" 
  ON ccmd_criterion_scores FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM ccmd_evaluations 
    WHERE id = evaluation_id AND jury_id = auth.uid()
  ));

-- MEMBER POINTS
ALTER TABLE ccmd_member_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Juries can manage their own member points" 
  ON ccmd_member_points FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM ccmd_evaluations 
    WHERE id = evaluation_id AND jury_id = auth.uid()
  ));

-- FINAL VERDICT
ALTER TABLE ccmd_final_verdict ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published verdicts" 
  ON ccmd_final_verdict FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Admins can manage verdicts" 
  ON ccmd_final_verdict FOR ALL 
  TO authenticated 
  USING (ccmd_is_admin(auth.uid()));
