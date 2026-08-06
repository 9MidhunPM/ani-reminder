import { PublicHome } from "@/components/public-home";
import { auth } from "@/auth";

export default async function Home() {
  const session = await auth();
  return <PublicHome isAuthenticated={Boolean(session?.user)} />;
}
