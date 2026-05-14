import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import WebSocket from "ws";
import dotenv from "dotenv";

Object.assign(global, { WebSocket });

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Supabase Service Client (Server Side Only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", supabaseConnected: !!supabaseAdmin });
});

// Get Signed URL for PDF (Admin/Jury only - simplified for this demo)
app.get("/api/pdf/:groupId/url", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  
  const { groupId } = req.params;
  
  // 1. Get storage path from DB
  const { data: group, error: dbError } = await supabaseAdmin
    .from('groups')
    .select('pdf_storage_path')
    .eq('id', groupId)
    .single();

  if (dbError || !group?.pdf_storage_path) {
    return res.status(404).json({ error: "PDF not found" });
  }

  // 2. Create signed URL
  const { data, error } = await supabaseAdmin
    .storage
    .from(process.env.SUPABASE_STORAGE_BUCKET || 'project-pdfs')
    .createSignedUrl(group.pdf_storage_path, 3600);

  if (error) return res.status(500).json({ error: error.message });
  
  res.json({ url: data.signedUrl });
});

// Publish Verdict (Admin Only)
app.post("/api/admin/publish-verdict", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  
  // Logic to calculate scores and publish verdict would go here
  // Using service role to bypass RLS and lock evaluations
  res.json({ success: true, message: "Verdict publication initiated" });
});

// Create new Jury (Admin Only)
app.post("/api/admin/jurys", async (req, res) => {
  if (!supabaseAdmin) return res.status(500).json({ error: "Supabase not configured" });
  
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      name,
      role: 'JURY'
    }
  });

  if (error) return res.status(400).json({ error: error.message });
  
  res.json({ success: true, user: data.user });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
