import { defineConfig, type Plugin, type PreviewServer, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  renameSync,
  unlinkSync,
  copyFileSync,
  readdirSync,
} from "fs";
import { join } from "path";
import type { IncomingMessage, ServerResponse } from "http";

const DATA_DIR = join(process.cwd(), "data");
const BACKUP_DIR = join(DATA_DIR, ".backups");
const MAX_BACKUPS = 3;
const ALLOWED = new Set([
  "workouts",
  "sessions",
  "errors",
  "resources",
  "planned-days",
  "free-practice",
]);

type Middleware = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) => void;

function rotateBackups(filePath: string, baseName: string) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  for (let i = MAX_BACKUPS; i >= 2; i--) {
    const from = join(BACKUP_DIR, `${baseName}.bak${i - 1}`);
    const to = join(BACKUP_DIR, `${baseName}.bak${i}`);
    if (existsSync(from)) {
      copyFileSync(from, to);
    }
  }
  if (existsSync(filePath)) {
    copyFileSync(filePath, join(BACKUP_DIR, `${baseName}.bak1`));
  }
  const entries = readdirSync(BACKUP_DIR)
    .filter((name) => name.startsWith(`${baseName}.bak`))
    .sort();
  for (const name of entries.slice(MAX_BACKUPS)) {
    unlinkSync(join(BACKUP_DIR, name));
  }
}

function atomicWrite(filePath: string, content: string) {
  const tmpPath = `${filePath}.tmp.${process.pid}`;
  writeFileSync(tmpPath, content, "utf-8");
  renameSync(tmpPath, filePath);
}

function writeCsvFile(filePath: string, baseName: string, content: string) {
  if (!content.trim()) {
    throw new Error("Refusing to write empty CSV");
  }
  rotateBackups(filePath, baseName);
  atomicWrite(filePath, content);
}

function attachCsvApi(
  register: (path: string, handler: Middleware) => void
) {
  register("/api/csv", (req, res, next) => {
    const url = req.url ?? "";
    const name = url.replace(/^\//, "").split("?")[0];
    if (!ALLOWED.has(name)) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }
    const filePath = join(DATA_DIR, `${name}.csv`);
    mkdirSync(DATA_DIR, { recursive: true });

    if (req.method === "GET") {
      if (!existsSync(filePath)) {
        res.statusCode = 404;
        res.end("Missing file");
        return;
      }
      res.setHeader("Content-Type", "text/csv");
      res.end(readFileSync(filePath, "utf-8"));
      return;
    }

    if (req.method === "PUT") {
      const chunks: Buffer[] = [];
      req.on("data", (chunk: Buffer) => chunks.push(chunk));
      req.on("end", () => {
        try {
          const content = Buffer.concat(chunks).toString("utf-8");
          writeCsvFile(filePath, name, content);
          res.statusCode = 200;
          res.end("ok");
        } catch (e) {
          res.statusCode = 500;
          res.end(e instanceof Error ? e.message : "Write failed");
        }
      });
      req.on("error", () => {
        res.statusCode = 500;
        res.end("Request error");
      });
      return;
    }

    next();
  });
}

function csvApiPlugin(): Plugin {
  return {
    name: "csv-api",
    configureServer(server: ViteDevServer) {
      attachCsvApi(server.middlewares.use.bind(server.middlewares));
    },
    configurePreviewServer(server: PreviewServer) {
      attachCsvApi(server.middlewares.use.bind(server.middlewares));
    },
  };
}

export default defineConfig({
  plugins: [react(), csvApiPlugin()],
});
