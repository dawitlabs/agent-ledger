"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-2 border-foreground shadow-pixel"
      onClick={async () => {
        await fetch("/api/auth", { method: "DELETE" });
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
