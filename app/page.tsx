import EducatorOutreachPortal from "@/components/EducatorOutreachPortal";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main>
      <EducatorOutreachPortal session={session} />
    </main>
  );
}
