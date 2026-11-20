"use client";

import { FormEvent, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { buttonClass } from "@/lib/styles";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export type CheckoutPayer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  attendeeType: string;
};

export function RegistrationCheckout({
  amount,
  payer,
  locked,
  accepted,
  onNeedTerms,
  onCovered,
  onPaid,
}: {
  amount: number;
  payer: CheckoutPayer;
  locked: boolean;
  accepted: boolean;
  onNeedTerms: () => void;
  onCovered: () => void;
  onPaid: (paymentIntentId: string) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const options = useMemo(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: {
        theme: "stripe" as const,
        variables: {
          colorPrimary: "#15345e",
          colorText: "#071e36",
          borderRadius: "12px",
          fontFamily: "Montserrat, sans-serif",
        },
      },
    };
  }, [clientSecret]);

  async function startPayment() {
    if (!accepted) {
      onNeedTerms();
      return;
    }
    if (!stripePromise) {
      setError("Card checkout is not configured.");
      return;
    }
    setStarting(true);
    setError("");
    try {
      const response = await fetch("/api/handle-stripe-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          currency: "usd",
          description: `SPS Registration ${payer.lastName} -- ${payer.attendeeType}`,
          metadata: {
            firstName: payer.firstName,
            lastName: payer.lastName,
            attendeeType: payer.attendeeType,
            email: payer.email.trim().toLowerCase(),
            phone: payer.phone,
            companyName: payer.company,
          },
        }),
      });
      const data = (await response.json()) as { clientSecret?: string; error?: string };
      if (!response.ok || !data.clientSecret) throw new Error(data.error || "Unable to initialize payment");
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  if (locked) {
    return <p className="text-deep">This registration is already checked out. Continue to the review.</p>;
  }

  if (amount === 0) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (!accepted) {
              onNeedTerms();
              return;
            }
            onCovered();
          }}
          className={`${buttonClass} w-full`}
        >
          Continue
        </button>
        {error && <p className="mt-3 text-base text-orange">{error}</p>}
      </div>
    );
  }

  if (clientSecret && options && stripePromise) {
    return (
      <Elements stripe={stripePromise} options={options}>
        <CardPayment amount={amount} payer={payer} accepted={accepted} onNeedTerms={onNeedTerms} onPaid={onPaid} />
      </Elements>
    );
  }

  return (
    <div>
      <button type="button" onClick={startPayment} disabled={starting} className={`${buttonClass} w-full`}>
        {starting ? "Starting payment…" : "Continue to payment"}
      </button>
      {error && <p className="mt-3 text-base text-orange">{error}</p>}
    </div>
  );
}

function CardPayment({
  amount,
  payer,
  accepted,
  onNeedTerms,
  onPaid,
}: {
  amount: number;
  payer: CheckoutPayer;
  accepted: boolean;
  onNeedTerms: () => void;
  onPaid: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!accepted) {
      onNeedTerms();
      return;
    }
    if (!stripe || !elements) {
      setError("Payment system is not ready. Please try again.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Check the card details and try again.");
        return;
      }

      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/register`,
          payment_method_data: {
            billing_details: {
              email: payer.email.trim().toLowerCase(),
              name: `${payer.firstName} ${payer.lastName}`.trim(),
            },
          },
        },
        redirect: "if_required",
      });

      if (result.error) {
        setError(result.error.message || "Payment was not completed.");
        return;
      }

      const status = result.paymentIntent?.status;
      const complete = status === "succeeded" || status === "processing" || status === "requires_capture";
      if (!result.paymentIntent || !complete) {
        setError(status === "requires_action" ? "Additional authentication is required to complete payment. Please try again." : "Payment was not completed. Please review your card details and try again.");
        return;
      }

      onPaid(result.paymentIntent.id);
    } catch (err) {
      console.error("Unexpected payment error", err);
      setError("An unexpected error occurred. Please try again or contact support.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <PaymentElement />
      {error && <p className="rounded-xl bg-orange/10 px-4 py-3 text-base text-orange">{error}</p>}
      <button type="submit" disabled={!stripe || !elements || submitting} className={`${buttonClass} w-full`}>
        {submitting ? "Processing payment…" : `Pay $${amount.toLocaleString("en-US")}`}
      </button>
    </form>
  );
}
