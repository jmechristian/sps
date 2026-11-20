import { NextResponse } from "next/server";
import Stripe from "stripe";

const TICKET_PRICE = 799;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "Card checkout is not configured." }, { status: 503 });
  }

  let body: {
    amount?: unknown;
    currency?: unknown;
    description?: unknown;
    metadata?: Record<string, unknown>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the form as JSON." }, { status: 400 });
  }

  const amount = typeof body.amount === "number" ? body.amount : Number(body.amount);
  if (amount !== TICKET_PRICE) {
    return NextResponse.json({ error: "Amount is required" }, { status: 400 });
  }

  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(body.metadata ?? {})) {
    if (typeof value === "string" && value.trim()) metadata[key] = value.trim().slice(0, 500);
  }

  try {
    const stripe = new Stripe(secret);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: typeof body.currency === "string" && body.currency ? body.currency : "usd",
      description: typeof body.description === "string" ? body.description.slice(0, 500) : "SPS Registration",
      allowed_payment_method_types: ["card"],
      metadata,
    });

    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error("SPS payment error", error);
    const message = error instanceof Error ? error.message : "Failed to initialize payment. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
