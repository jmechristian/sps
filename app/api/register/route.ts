import { NextResponse } from "next/server";
import { createRegistration, registrationInput } from "@/lib/registrants";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  const input = registrationInput(body);
  if (!input) return NextResponse.json({ error: "Choose an attendee type." }, { status: 400 });

  try {
    const result = await createRegistration(input);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error("SPS registration failed", error);
    const message = error instanceof Error ? error.message : "Could not save the registration.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
