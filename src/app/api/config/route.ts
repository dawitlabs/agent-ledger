import { NextResponse } from "next/server";
import { getPublicConfig } from "@/lib/env";

export async function GET() {
  const config = getPublicConfig();
  // Anon key is designed to be public (RLS protects data).
  return NextResponse.json(config);
}
