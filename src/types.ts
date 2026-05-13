import { createClient } from '@supabase/supabase-js';

// Client types (matches Supabase Auth metadata)
export enum UserRole {
  ADMIN = 'ADMIN',
  JURY = 'JURY',
}

export type Profile = {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
};

export type Group = {
  id: string;
  name: string;
  project_title: string;
  description: string;
  pdf_storage_path: string | null;
  created_at: string;
  updated_at: string;
};

export type Member = {
  id: string;
  group_id: string;
  name: string;
  role: string;
  email: string | null;
  photo_url: string | null;
  order: number;
  created_at: string;
  updated_at: string;
};

export type Criterion = {
  id: string;
  name: string;
  max_score: number;
  order: number;
};

export type Evaluation = {
  id: string;
  jury_id: string;
  group_id: string;
  total_score: number;
  comment: string | null;
  submitted: boolean;
  locked: boolean;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CriterionScore = {
  id: string;
  evaluation_id: string;
  criterion_id: string;
  score: number;
};

export type MemberPoint = {
  id: string;
  evaluation_id: string;
  member_id: string;
  points: number;
  reason: string | null;
};

export type FinalVerdictStatus = 'PENDING' | 'CALCULATING' | 'PUBLISHED' | 'DRAW';

export type FinalVerdict = {
  id: string;
  status: FinalVerdictStatus;
  winning_group_id: string | null;
  group_one_id: string;
  group_one_score: number;
  group_two_id: string;
  group_two_score: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};
