import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";
Object.assign(global, { WebSocket });

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

async function check() {
  const { data, error } = await supabaseAdmin.from('ccmd_members').select('*').order('order');
  console.log("Error:", error);
  console.log("Data length:", data?.length);
}

check();
