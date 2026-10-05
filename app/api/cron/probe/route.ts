import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ error: "HTTP-triggered collection is disabled. Run the supervised probe daemon." }, { status: 410 });
}
