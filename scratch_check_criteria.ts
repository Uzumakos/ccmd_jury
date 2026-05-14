import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";
Object.assign(global, { WebSocket });

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

async function check() {
  const { data: criteria } = await supabaseAdmin.from('ccmd_criteria').select('*');
  console.log(`Found ${criteria?.length || 0} criteria.`);

  const { data: members } = await supabaseAdmin.from('ccmd_members').select('*');
  console.log(`Found ${members?.length || 0} members total in the database.`);
}

check();
