import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import helmet from "helmet";
import cors from "cors";
import { apiLimiter } from "./middleware/limiters.ts";
import leadRoutes from "./routes/leadRoutes.ts";
import profileRoutes from "./routes/profileRoutes.ts";
import proxyRoutes from "./routes/proxyRoutes.ts";
import billingRoutes from "./routes/billingRoutes.ts";
import adminRoutes from "./routes/adminRoutes.ts";
import archiver from "archiver";
import { authenticate } from "./middleware/auth.ts";
import { syncUser } from "./middleware/syncUser.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createApp() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true
  }));

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  }));

  app.use("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/me", authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // Billing webhook needs to be BEFORE express.json() and authenticate
  app.use("/api/billing", billingRoutes);

  app.use(express.json());
  app.use("/api/", apiLimiter);
  app.use("/api/", authenticate);
  app.use("/api/", syncUser);

  app.use("/api/leads", leadRoutes);
  app.use("/api/profiles", profileRoutes);
  app.use("/api/proxy", proxyRoutes);
  app.use("/api/admin", adminRoutes);

  app.get("/api/download-source", (req, res) => {
    res.attachment('shophunter-source.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    archive.on('error', (err) => {
      console.error("Archive error:", err);
      if (!res.headersSent) res.status(500).send({error: err.message});
    });
    
    archive.pipe(res);
    
    archive.glob('**/*', {
      cwd: path.resolve(__dirname, '..'),
      ignore: ['node_modules/**', 'frontend/dist/**', '.git/**', '.github-backup/**']
    });
    
    archive.finalize();
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
      root: path.resolve(__dirname, "..", "frontend"),
      configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.originalUrl.startsWith("/api")) {
        return res.status(404).json({ error: "API route not found" });
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}
