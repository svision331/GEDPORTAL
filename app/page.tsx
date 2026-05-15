import EducatorOutreachPortal from "@/components/EducatorOutreachPortal";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function Home() {
  const session = await auth();

  // Seed default user if none exists
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.user.create({
      data: {
        email: "admin@gedportal.edu",
        password: hashedPassword,
        name: "Mr. Caldwell",
        role: "ADMIN",
      },
    });
  }

  return (
    <main>
      <EducatorOutreachPortal session={session} />
    </main>
  );
}
