"use client";

import Link from "next/link";
import { useState } from "react";
import { fieldClass, labelClass } from "@/lib/styles";

const steps = ["Contact", "Interests", "Payment", "Confirmation"];
const price = 799;

const attendeeTypes = [
  {
    id: "brand",
    label: "Brand owners / packaging engineers / procurement",
    limit: "Up to 3 registrations per company.",
  },
  {
    id: "provider",
    label: "Solution provider",
    limit: "1 registration per solution provider company.",
  },
  {
    id: "sponsor",
    label: "Sponsor",
    limit: "Up to 3 registrations per company.",
  },
] as const;

type AttendeeType = (typeof attendeeTypes)[number]["id"];

const interests = [
  "Paper and corrugated",
  "Plastics (e.g. bottles, films, bags, trays, foam)",
  "Metals (e.g. aluminum and steel cans, foil, and metal drums)",
  "Glass (e.g. bottles, jars)",
  "Wood (e.g. pallets, crates)",
  "Technology solution",
  "3rd party logistics",
  "Co-packaging / co-manufacturing",
  "Small-batch production / pilot plants",
];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  attendeeType: AttendeeType;
  challenge: string;
  solution: string;
  opportunity: string;
  interests: string[];
  coupon: string;
  terms: boolean;
};

const empty: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  attendeeType: "brand",
  challenge: "",
  solution: "",
  opportunity: "",
  interests: [],
  coupon: "",
  terms: false,
};

export function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selected = attendeeTypes.find((type) => type.id === form.attendeeType) ?? attendeeTypes[0];

  function update<K extends keyof FormState>(name: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function toggleInterest(value: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((item) => item !== value)
        : [...current.interests, value],
    }));
  }

  function validate(index: number) {
    const next: Record<string, string> = {};
    if (index === 0) {
      if (!form.firstName.trim()) next.firstName = "First name is required.";
      if (!form.lastName.trim()) next.lastName = "Last name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email.";
      if (!form.phone.trim()) next.phone = "Phone number is required.";
      if (!form.company.trim()) next.company = "Company name is required.";
      if (!form.jobTitle.trim()) next.jobTitle = "Job title is required.";
      if (form.attendeeType === "brand" && !form.challenge.trim()) next.challenge = "Describe the packaging challenge you are bringing.";
      if (form.attendeeType === "provider") {
        if (!form.solution.trim()) next.solution = "Describe the solution you are bringing.";
        if (!form.opportunity.trim()) next.opportunity = "Describe the packaging challenge or buying opportunity.";
      }
      if (form.attendeeType === "sponsor" && !form.solution.trim()) next.solution = "Describe the solution you are bringing.";
    }
    if (index === 3 && !form.terms) next.terms = "Accept the event terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueStep() {
    if (!validate(step)) return;
    setStep((value) => Math.min(3, value + 1));
  }

  return (
    <div className="rounded-3xl border border-navy/10 bg-paper p-5 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-navy/60">Southeastern Packaging Summit</p>
        <p className="font-display text-3xl font-semibold tracking-tight text-navy">${price}</p>
      </div>
      <ol className="mt-6 grid gap-2 sm:grid-cols-4">
        {steps.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => {
                  if (index < step) setStep(index);
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange ${active ? "bg-navy text-cream" : "bg-cream text-navy hover:bg-cream-deep"}`}
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-xs font-bold ${active ? "bg-orange text-white" : done ? "bg-navy text-cream" : "bg-white text-navy"}`}>
                  {index + 1}
                </span>
                <span className="font-display text-xs font-semibold uppercase tracking-[0.08em]">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mt-8">
        {step === 0 && (
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="First name" value={form.firstName} error={errors.firstName} onChange={(value) => update("firstName", value)} />
            <Field label="Last name" value={form.lastName} error={errors.lastName} onChange={(value) => update("lastName", value)} />
            <Field label="Email address" type="email" value={form.email} error={errors.email} onChange={(value) => update("email", value)} />
            <Field label="Phone number" type="tel" value={form.phone} error={errors.phone} onChange={(value) => update("phone", value)} />
            <Field label="Company name" value={form.company} error={errors.company} onChange={(value) => update("company", value)} />
            <Field label="Job title" value={form.jobTitle} error={errors.jobTitle} onChange={(value) => update("jobTitle", value)} />
            <fieldset className="md:col-span-2">
              <legend className={labelClass}>Attendee type</legend>
              <div className="grid gap-2">
                {attendeeTypes.map((type) => (
                  <label key={type.id} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${form.attendeeType === type.id ? "border-orange bg-orange/5" : "border-navy/15 hover:border-navy/40"}`}>
                    <input
                      type="radio"
                      name="attendeeType"
                      checked={form.attendeeType === type.id}
                      onChange={() => update("attendeeType", type.id)}
                      className="mt-1 accent-orange"
                    />
                    <span>
                      <span className="block text-deep">{type.label}</span>
                      <span className="mt-1 block text-base text-navy/60">{type.limit}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {form.attendeeType === "brand" && (
              <TextArea
                label="Describe the packaging challenge you are bringing"
                value={form.challenge}
                error={errors.challenge}
                onChange={(value) => update("challenge", value)}
              />
            )}
            {form.attendeeType !== "brand" && (
              <TextArea
                label="Bring a solution"
                value={form.solution}
                error={errors.solution}
                onChange={(value) => update("solution", value)}
              />
            )}
            {form.attendeeType === "provider" && (
              <TextArea
                label="Describe the packaging challenge or buying opportunity"
                value={form.opportunity}
                error={errors.opportunity}
                onChange={(value) => update("opportunity", value)}
              />
            )}
            <div className="rounded-2xl bg-cream px-4 py-4 md:col-span-2">
              <p className="text-deep">Speaker registration stays off this form.</p>
              <Link href="/speak" className="mt-2 inline-block font-display text-sm font-semibold text-orange hover:text-orange-deep">
                Send speaker interest to the Packaging School
              </Link>
            </div>
          </div>
        )}

        {step === 1 && (
          <fieldset>
            <legend className={labelClass}>Interest areas</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {interests.map((item) => (
                <label key={item} className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition ${form.interests.includes(item) ? "border-orange bg-orange/5" : "border-navy/15 hover:border-navy/40"}`}>
                  <input
                    type="checkbox"
                    checked={form.interests.includes(item)}
                    onChange={() => toggleInterest(item)}
                    className="mt-1 accent-orange"
                  />
                  {item}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <div className="rounded-2xl bg-cream px-5 py-5">
              <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Registration</p>
              <p className="mt-2 font-display text-4xl font-semibold tracking-tight text-navy">${price}</p>
              <p className="mt-3 text-deep/80">{selected.limit} One coupon per company. An added seat can be purchased at ${price}.</p>
            </div>
            <Field label="Coupon code" value={form.coupon} onChange={(value) => update("coupon", value)} />
            <div>
              <p className={labelClass}>Amount due</p>
              <p className="font-display text-2xl font-semibold text-navy">${price}</p>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Review</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Item term="Name" value={`${form.firstName} ${form.lastName}`.trim()} />
              <Item term="Email" value={form.email} />
              <Item term="Phone" value={form.phone} />
              <Item term="Company" value={form.company} />
              <Item term="Title" value={form.jobTitle} />
              <Item term="Attendee type" value={selected.label} />
              <Item term="Interests" value={form.interests.join(", ") || "—"} />
              <Item term="Amount due" value={`$${price}${form.coupon.trim() ? ` · coupon ${form.coupon.trim()}` : ""}`} />
            </dl>
            {form.attendeeType === "brand" && form.challenge && <Note label="Packaging challenge" value={form.challenge} />}
            {form.attendeeType !== "brand" && form.solution && <Note label="Solution" value={form.solution} />}
            {form.attendeeType === "provider" && form.opportunity && <Note label="Challenge or buying opportunity" value={form.opportunity} />}
            <label className="mt-6 flex items-start gap-3 text-navy/80">
              <input type="checkbox" checked={form.terms} onChange={(event) => update("terms", event.target.checked)} className="mt-1 accent-orange" />
              I agree to the event terms.
            </label>
            {errors.terms && <p className="mt-2 text-base text-orange">{errors.terms}</p>}
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0}
          className="rounded-full px-4 py-2 font-display text-sm font-semibold text-navy transition hover:text-orange disabled:cursor-not-allowed disabled:text-navy/30"
        >
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={continueStep}
            className="rounded-full bg-navy px-5 py-3 font-display text-sm font-semibold text-cream transition hover:bg-ink active:scale-[0.98]"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="rounded-full bg-navy/20 px-5 py-3 font-display text-sm font-semibold text-navy/60"
          >
            Pay ${price}
          </button>
        )}
      </div>
      {step === 3 && <p className="mt-3 text-base text-navy/60">Card checkout is the next piece. This page does not charge a card yet.</p>}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  const id = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return (
    <label htmlFor={id}>
      <span className={labelClass}>{label}</span>
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} aria-invalid={Boolean(error)} />
      {error && <span className="mt-2 block text-base text-orange">{error}</span>}
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const id = label.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return (
    <label htmlFor={id} className="md:col-span-2">
      <span className={labelClass}>{label}</span>
      <textarea id={id} rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass} aria-invalid={Boolean(error)} />
      {error && <span className="mt-2 block text-base text-orange">{error}</span>}
    </label>
  );
}

function Item({ term, value }: { term: string; value: string }) {
  return (
    <div>
      <dt className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-navy/60">{term}</dt>
      <dd className="text-deep">{value}</dd>
    </div>
  );
}

function Note({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="font-display text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-navy/60">{label}</p>
      <p className="text-deep">{value}</p>
    </div>
  );
}
