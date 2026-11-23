"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { RegistrationCheckout } from "@/components/RegistrationCheckout";
import { fieldClass, labelClass } from "@/lib/styles";

const formFieldClass = fieldClass.replace("text-xl", "text-lg");

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

const otherInterest = "Other";

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
  "Reusable packaging",
  "Protective packaging and dunnage",
  "Returnable packaging and tracking",
  "Bio-based material",
  "Testing",
  "Medical packaging",
  "Package design prototyping",
  "Package printing and decoration",
  otherInterest,
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
  otherInterest: string;
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
  otherInterest: "",
  coupon: "",
  terms: false,
};

export function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discountApplied, setDiscountApplied] = useState(false);
  const [checkingCode, setCheckingCode] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [covered, setCovered] = useState(false);
  const [registrantId, setRegistrantId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const savingRef = useRef(false);
  const checkedOut = Boolean(paymentIntentId) || covered;
  const amountDue = discountApplied ? 0 : price;

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
    setForm((current) => {
      const selected = current.interests.includes(value);
      return {
        ...current,
        interests: selected ? current.interests.filter((item) => item !== value) : [...current.interests, value],
        otherInterest: value === otherInterest && selected ? "" : current.otherInterest,
      };
    });
    if (value === otherInterest) {
      setErrors((current) => {
        if (!current.otherInterest) return current;
        const next = { ...current };
        delete next.otherInterest;
        return next;
      });
    }
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
    if (index === 1 && form.interests.includes(otherInterest) && !form.otherInterest.trim()) {
      next.otherInterest = "Describe the other interest.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function continueStep() {
    if (!validate(step)) return;
    setStep((value) => Math.min(2, value + 1));
  }

  function changeCoupon(value: string) {
    update("coupon", value);
    if (discountApplied) setDiscountApplied(false);
    setErrors((current) => {
      if (!current.coupon) return current;
      const next = { ...current };
      delete next.coupon;
      return next;
    });
  }

  async function applyDiscount() {
    if (checkedOut) return;
    if (!form.coupon.trim()) {
      setErrors((current) => ({ ...current, coupon: "Please enter a discount code" }));
      setDiscountApplied(false);
      return;
    }
    setCheckingCode(true);
    try {
      const response = await fetch("/api/discount-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: form.coupon }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setDiscountApplied(false);
        setErrors((current) => ({ ...current, coupon: data.error || "Invalid discount code" }));
        return;
      }
      setDiscountApplied(true);
      setForm((current) => ({ ...current, coupon: current.coupon.trim() }));
      setErrors((current) => {
        if (!current.coupon) return current;
        const next = { ...current };
        delete next.coupon;
        return next;
      });
    } catch {
      setDiscountApplied(false);
      setErrors((current) => ({ ...current, coupon: "Could not check that code. Try again." }));
    } finally {
      setCheckingCode(false);
    }
  }

  function removeDiscount() {
    if (checkedOut) return;
    setDiscountApplied(false);
    update("coupon", "");
  }

  function requireTerms() {
    if (form.terms) return true;
    setErrors((current) => ({ ...current, terms: "Accept the event terms to continue." }));
    return false;
  }

  async function completeRegistration(intentId: string | null) {
    if (savingRef.current || registrantId) return;
    savingRef.current = true;
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          company: form.company,
          jobTitle: form.jobTitle,
          attendeeType: form.attendeeType,
          challenge: form.challenge,
          solution: form.solution,
          opportunity: form.opportunity,
          interests: form.interests,
          otherInterest: form.otherInterest,
          coupon: discountApplied ? form.coupon : "",
          terms: form.terms,
          paymentIntentId: intentId,
        }),
      });
      const data = (await response.json()) as { id?: string; error?: string };
      if (!response.ok || !data.id) throw new Error(data.error || "Could not save the registration.");
      setRegistrantId(data.id);
      setStep(3);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Could not save the registration.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-navy/10 bg-paper p-5 text-lg md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-navy/60">Southeastern Packaging Summit</p>
        <p className="font-display text-3xl font-semibold tracking-tight text-navy">${amountDue.toLocaleString("en-US")}</p>
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
            {form.interests.includes(otherInterest) && (
              <div className="mt-4">
                <Field
                  label="Please describe"
                  value={form.otherInterest}
                  error={errors.otherInterest}
                  onChange={(value) => update("otherInterest", value)}
                />
              </div>
            )}
          </fieldset>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <div className="rounded-2xl bg-cream px-5 py-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-deep">Registration</p>
                {discountApplied ? (
                  <p className="font-display text-2xl font-semibold text-navy">
                    <span className="mr-3 text-lg font-medium text-navy/40 line-through">${price.toLocaleString("en-US")}</span>
                    $0
                  </p>
                ) : (
                  <p className="font-display text-2xl font-semibold text-navy">${price.toLocaleString("en-US")}</p>
                )}
              </div>
              {discountApplied && <p className="mt-2 text-base text-navy/70">Discount ({form.coupon})</p>}
              <div className="mt-4 flex items-baseline justify-between border-t border-navy/10 pt-4">
                <p className="font-display text-xs font-semibold uppercase tracking-[0.16em] text-navy/60">Total</p>
                <p className="font-display text-3xl font-semibold tracking-tight text-navy">${amountDue.toLocaleString("en-US")}</p>
              </div>
              <p className="mt-3 text-base text-deep/70">{selected.limit}</p>
            </div>
            <div>
              <span className={labelClass}>Discount code</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={form.coupon}
                  onChange={(event) => changeCoupon(event.target.value)}
                  disabled={discountApplied || checkedOut}
                  placeholder="Enter code"
                  className={formFieldClass}
                  aria-invalid={Boolean(errors.coupon)}
                />
                {discountApplied ? (
                  <button type="button" onClick={removeDiscount} disabled={checkedOut} className="rounded-full bg-orange px-5 py-3 font-display text-sm font-semibold text-white transition hover:bg-orange-deep disabled:cursor-not-allowed disabled:bg-navy/25">
                    Remove
                  </button>
                ) : (
                  <button type="button" onClick={applyDiscount} disabled={checkingCode || checkedOut} className="rounded-full bg-navy px-5 py-3 font-display text-sm font-semibold text-cream transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-navy/25">
                    {checkingCode ? "Checking…" : "Apply"}
                  </button>
                )}
              </div>
              {errors.coupon && <p className="mt-2 text-base text-orange">{errors.coupon}</p>}
              {discountApplied && <p className="mt-2 text-base text-navy">Code applied. Registration is $0.</p>}
            </div>
            <label className="flex items-start gap-3 text-navy/80">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(event) => update("terms", event.target.checked)}
                className="mt-1 accent-orange"
              />
              I agree to the event terms.
            </label>
            {errors.terms && <p className="text-base text-orange">{errors.terms}</p>}
            <RegistrationCheckout
              key={amountDue}
              amount={amountDue}
              payer={{
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                phone: form.phone,
                company: form.company,
                attendeeType: selected.label,
              }}
              locked={checkedOut}
              accepted={form.terms}
              onNeedTerms={() => {
                requireTerms();
              }}
              onCovered={() => {
                setCovered(true);
                void completeRegistration(null);
              }}
              onPaid={(id) => {
                setPaymentIntentId(id);
                void completeRegistration(id);
              }}
            />
            {saveError && <p className="text-base text-orange">{saveError}</p>}
            {checkedOut && !registrantId && (
              <button type="button" onClick={() => void completeRegistration(paymentIntentId)} disabled={saving} className="rounded-full bg-navy px-5 py-3 font-display text-sm font-semibold text-cream disabled:bg-navy/25">
                {saving ? "Saving registration…" : "Save registration"}
              </button>
            )}
          </div>
        )}

        {step === 3 && registrantId && (
          <Confirmation
            registrantId={registrantId}
            name={`${form.firstName} ${form.lastName}`.trim()}
            email={form.email}
            phone={form.phone}
            company={form.company}
            jobTitle={form.jobTitle}
            attendee={selected.label}
            discountCode={discountApplied ? form.coupon : ""}
            amountDue={amountDue}
          />
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((value) => Math.max(0, value - 1))}
          disabled={step === 0 || Boolean(registrantId)}
          className="rounded-full px-4 py-2 font-display text-sm font-semibold text-navy transition hover:text-orange disabled:cursor-not-allowed disabled:text-navy/30"
        >
          Back
        </button>
        {step < 2 && (
          <button
            type="button"
            onClick={continueStep}
            className="rounded-full bg-navy px-5 py-3 font-display text-sm font-semibold text-cream transition hover:bg-ink active:scale-[0.98]"
          >
            Continue
          </button>
        )}
      </div>
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
      <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} className={formFieldClass} aria-invalid={Boolean(error)} />
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
      <textarea id={id} rows={4} value={value} onChange={(event) => onChange(event.target.value)} className={formFieldClass} aria-invalid={Boolean(error)} />
      {error && <span className="mt-2 block text-base text-orange">{error}</span>}
    </label>
  );
}

function Confirmation({
  registrantId,
  name,
  email,
  phone,
  company,
  jobTitle,
  attendee,
  discountCode,
  amountDue,
}: {
  registrantId: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  attendee: string;
  discountCode: string;
  amountDue: number;
}) {
  const registrationLabel = attendee === "Sponsor" ? "Sponsor registration" : attendee === "Solution provider" ? "Solution provider registration" : "General registration";
  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-6 rounded-3xl bg-deep px-6 py-8 text-cream md:flex-row md:items-center md:justify-between md:px-8">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">Registration complete</h2>
          <p className="mt-2 font-display text-xs font-semibold uppercase tracking-[0.16em] text-gold">Southeastern Packaging Summit · April 19–20, 2027</p>
          <p className="mt-3 max-w-xl text-cream/80">Your registration is confirmed. The receipt is below, and your dashboard has the same details.</p>
        </div>
        <div className="flex w-full max-w-xs flex-col gap-3">
          <Link href={`/registrants/${registrantId}`} className="rounded-full bg-orange px-5 py-3 text-center font-display text-sm font-semibold text-white hover:bg-orange-deep">
            View registrant dashboard
          </Link>
          <button type="button" onClick={() => window.print()} className="rounded-full border border-cream/30 px-5 py-3 font-display text-sm font-semibold text-cream hover:border-gold hover:text-gold">
            Print invoice
          </button>
        </div>
      </div>
      <div className="overflow-hidden rounded-3xl border border-navy/10">
        <div className="flex items-start justify-between gap-4 border-b border-navy/10 px-6 py-4">
          <div>
            <h3 className="font-display text-xl font-semibold text-deep">Registration invoice</h3>
            <p className="text-base text-navy/60">Southeastern Packaging Summit · April 19–20, 2027</p>
          </div>
          <p className="font-display text-xs text-navy/50">#{registrantId}</p>
        </div>
        <div className="grid gap-8 px-6 py-6 lg:grid-cols-3">
          <div>
            <h4 className="font-display text-sm font-semibold text-deep">Registrant</h4>
            <div className="mt-2 space-y-1 text-base text-deep/80">
              <p className="font-semibold text-deep">{name}</p>
              <p>{email}</p>
              <p>{company}</p>
              <p>{jobTitle}</p>
              <p>{phone}</p>
              <p><span className="font-semibold text-deep">Type:</span> {attendee}</p>
            </div>
          </div>
          <div className="lg:col-span-2">
            <h4 className="font-display text-sm font-semibold text-deep">Itemized charges</h4>
            <div className="mt-3 overflow-hidden rounded-2xl border border-navy/10">
              <div className="grid grid-cols-12 gap-2 bg-cream px-4 py-2 font-display text-xs font-semibold uppercase tracking-[0.12em] text-navy/55">
                <span className="col-span-7">Description</span>
                <span className="col-span-2 text-right">Qty</span>
                <span className="col-span-3 text-right">Amount</span>
              </div>
              <div className="grid grid-cols-12 gap-2 border-t border-navy/10 px-4 py-3 text-base">
                <span className="col-span-7">{registrationLabel} – {name}</span>
                <span className="col-span-2 text-right">1</span>
                <span className="col-span-3 text-right">${price}</span>
              </div>
              <div className="space-y-1 border-t border-navy/10 bg-cream px-4 py-3 text-base">
                <div className="flex justify-between"><span>Subtotal</span><span>${price}</span></div>
                {discountCode && (
                  <div className="flex justify-between">
                    <span>Discount ({discountCode})</span>
                    <span>-${price}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-navy/10 pt-2 font-semibold text-deep">
                  <span>Total due</span>
                  <span>${amountDue}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
