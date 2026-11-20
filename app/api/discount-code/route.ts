import { NextResponse } from "next/server";
import { checkDiscountCode } from "@/lib/discount";

export async function POST(request: Request) {
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  const result = await checkDiscountCode(typeof body.code === "string" ? body.code : "");
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true });
}
