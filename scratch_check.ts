import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log('--- Profiles ---');
  const { data: profiles } = await supabase.from('ccmd_profiles').select('*');
  console.log(profiles);

  console.log('--- Evaluations ---');
  const { data: evals } = await supabase.from('ccmd_evaluations').select('*');
  console.log(evals);

  console.log('--- Member Points ---');
  const { data: mpoints } = await supabase.from('ccmd_member_points').select('*');
  console.log(mpoints);
}

check();
