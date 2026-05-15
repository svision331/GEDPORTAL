/**
 * Prisma seed script — runs once at deploy time, not on every page request.
 *
 * Usage:
 *   npx tsx prisma/seed.ts
 *
 * Or add to package.json:
 *   "prisma": { "seed": "tsx prisma/seed.ts" }
 * Then run: npx prisma db seed
 *
 * Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD env vars to override defaults.
 * IMPORTANT: change the default password immediately after first login.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@gedportal.edu";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "Administrator";

  if (!password) {
    console.error("Error: SEED_ADMIN_PASSWORD env var is required.");
    console.error("Set it before running: SEED_ADMIN_PASSWORD=yourpassword npx tsx prisma/seed.ts");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email} — skipping seed.`);
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: "ADMIN",
    },
  });

  console.log(`Admin user created: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
