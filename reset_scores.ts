import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or SERVICE ROLE KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetScores() {
  console.log('Resetting all evaluations and verdicts...');
  
  // 1. Delete all evaluations
  const { error: evalError } = await supabase
    .from('ccmd_evaluations')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (evalError) {
    console.error('Error deleting evaluations:', evalError);
  } else {
    console.log('Successfully deleted all evaluations (and cascaded scores).');
  }

  // 2. Delete final verdicts
  const { error: verdictError } = await supabase
    .from('ccmd_final_verdict')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (verdictError) {
    console.error('Error deleting verdicts:', verdictError);
  } else {
    console.log('Successfully deleted all final verdicts.');
  }
}

resetScores();
