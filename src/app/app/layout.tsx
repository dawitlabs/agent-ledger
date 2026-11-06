import Link from "next/link";
import { redirect } from "next/navigation";
import { Radio } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SignOutButton } from "@/components/app/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-foreground bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/app" className="flex items-center gap-2">
              <span className="inline-flex size-7 items-center justify-center border-2 border-foreground bg-foreground text-background shadow-pixel">
                <Radio className="size-3.5" />
              </span>
              <span className="font-pixel text-[10px]">RELAY</span>
            </Link>
            <nav className="hidden items-center gap-3 font-mono text-xs md:flex">
              <Link href="/app" className="hover:underline">
                Rooms
              </Link>
              <Link href="/app/rooms/new" className="hover:underline">
                New room
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 sm:flex">
              <span
                className="flex size-7 items-center justify-center border-2 border-foreground font-pixel text-[8px] text-background"
                style={{ backgroundColor: user.color }}
              >
                {user.initials}
              </span>
              <span className="font-mono text-xs">{user.name}</span>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
