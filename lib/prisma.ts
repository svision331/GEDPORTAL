import { PrismaClient } from "@prisma/client";

import fs from "fs";
import path from "path";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Vercel read-only filesystem workaround for SQLite
let dbUrl = process.env.DATABASE_URL;
if (process.env.VERCEL) {
  const tmpDbPath = "/tmp/dev.db";
  const localDbPath = path.join(process.cwd(), "dev.db");
  
  if (!fs.existsSync(tmpDbPath)) {
    try {
      if (fs.existsSync(localDbPath)) {
        fs.copyFileSync(localDbPath, tmpDbPath);
      }
    } catch (e) {
      console.error("Failed to copy DB to /tmp", e);
    }
  }
  dbUrl = `file:${tmpDbPath}`;
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["query"],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
