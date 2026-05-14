import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import WebSocket from "ws";
Object.assign(global, { WebSocket });

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

async function check() {
  console.log("Checking buckets...");
  const { data: buckets, error: bucketsError } = await supabaseAdmin.storage.listBuckets();
  if (bucketsError) {
    console.error("Error listing buckets:", bucketsError);
  } else {
    console.log(`Found ${buckets.length} buckets:`);
    buckets.forEach(b => console.log(`- ${b.id} (public: ${b.public})`));
  }

  console.log("\nChecking ccmd_groups pdf_storage_path...");
  const { data: groups, error: groupsError } = await supabaseAdmin.from('ccmd_groups').select('id, name, pdf_storage_path');
  if (groupsError) {
    console.error("Error listing groups:", groupsError);
  } else {
    groups.forEach(g => {
      console.log(`Group: ${g.name}`);
      console.log(`  pdf_storage_path: ${g.pdf_storage_path}`);
      if (g.pdf_storage_path) {
         const { data } = supabaseAdmin.storage.from('ccmd_documents').getPublicUrl(g.pdf_storage_path);
         console.log(`  publicUrl: ${data.publicUrl}`);
      }
    });
  }
}

check();
