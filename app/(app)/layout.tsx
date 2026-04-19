import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/sign-in");
  return <div className="min-h-screen">{children}</div>;
}
