import { NextResponse } from "next/server";
import { sendInterestEmail } from "@/lib/email";

const fields = ["name", "email", "phone", "company", "title"] as const;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  if (typeof body.companyWebsite === "string" && body.companyWebsite.trim()) {
    return NextResponse.json({ ok: true });
  }

  const lines = fields.map((key) => [key, String(body[key] ?? "").trim()] as [string, string]);
  if (lines.some(([, value]) => !value)) {
    return NextResponse.json({ error: "Fill in every field." }, { status: 400 });
  }
  const email = lines.find(([key]) => key === "email")?.[1] ?? "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const labels: Record<string, string> = {
    name: "Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    title: "Title",
  };

  try {
    await sendInterestEmail(
      "Southeastern Packaging Summit — sponsor interest",
      lines.map(([key, value]) => [labels[key] || key, value]),
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send email.";
    if (message !== "Email is not configured.") console.error(error);
    const status = message === "Email is not configured." ? 503 : 502;
    return NextResponse.json(
      { error: status === 503 ? "Email is not configured yet. Write info@packagingschool.com directly." : "The message did not send. Try again, or email info@packagingschool.com." },
      { status },
    );
  }
}
