import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  const user = session?.user;
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <SignOutButton />
      </div>
      <p className="mt-4 text-muted-foreground">Hello {user?.name ?? user?.email}.</p>
      <form action="/api/stripe/portal" method="POST" className="mt-6">
        <Button type="submit">Manage billing</Button>
      </form>
    </div>
  );
}
