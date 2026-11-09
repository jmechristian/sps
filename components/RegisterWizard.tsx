"use client";

import { useState } from "react";
import { fieldClass, labelClass } from "@/lib/styles";

const steps = ["Basic Information", "Interests & Preferences", "Payment", "Confirmation"];

const attendeeTypes = [
  "Packaging engineer",
  "Packaging provider",
  "Brand or supply chain",
  "Sponsor",
  "Speaker",
];

const interests = [
  "Materials",
  "Line performance",
  "Damage and distribution",
  "Sustainability",
  "Testing and labs",
  "Supplier matching",
];

const empty = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  jobTitle: "",
  attendeeType: "Packaging engineer",
  interests: [] as string[],
  challenge: "",
};

export function RegisterWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(empty);

  function update(name: keyof typeof empty, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleInterest(value: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((item) => item !== value)
        : [...current.interests, value],
    }));
  }

  return (
    <div className="rounded-3xl border border-navy/10 bg-paper p-5 md:p-8">
      <p className="rounded-2xl bg-gold/15 px-4 py-3 text-deep">
        Registration is not open. You can walk the steps. Nothing on this form is saved or charged.
      </p>
      <ol className="mt-6 grid gap-2 sm:grid-cols-4">
        {steps.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => setStep(index)}
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
            <Field label="First name" value={form.firstName} onChange={(value) => update("firstName", value)} />
            <Field label="Last name" value={form.lastName} onChange={(value) => update("lastName", value)} />
            <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
            <Field label="Phone" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
            <Field label="Company" value={form.company} onChange={(value) => update("company", value)} />
            <Field label="Job title" value={form.jobTitle} onChange={(value) => update("jobTitle", value)} />
            <fieldset className="md:col-span-2">
              <legend className={labelClass}>Attendee type</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {attendeeTypes.map((type) => (
                  <label key={type} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${form.attendeeType === type ? "border-orange bg-orange/5" : "border-navy/15 hover:border-navy/40"}`}>
                    <input
                      type="radio"
                      name="attendeeType"
                      checked={form.attendeeType === type}
                      onChange={() => update("attendeeType", type)}
                      className="accent-orange"
                    />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {step === 1 && (
          <div className="grid gap-5">
            <fieldset>
              <legend className={labelClass}>What do you want out of the room?</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {interests.map((item) => (
                  <label key={item} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${form.interests.includes(item) ? "border-orange bg-orange/5" : "border-navy/15 hover:border-navy/40"}`}>
                    <input
                      type="checkbox"
                      checked={form.interests.includes(item)}
                      onChange={() => toggleInterest(item)}
                      className="accent-orange"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              <span className={labelClass}>Packaging challenge</span>
              <textarea
                rows={5}
                value={form.challenge}
                onChange={(event) => update("challenge", event.target.value)}
                className={fieldClass}
                placeholder="The spec, the line, or the lane that is not working."
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-deep/80">
              Pricing has not been announced. Card fields stay locked until registration opens. There is no charge on this page.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Field label="Name on card" value="" onChange={() => undefined} disabled />
              <Field label="Card number" value="" onChange={() => undefined} disabled />
              <Field label="Expiration" value="" onChange={() => undefined} disabled />
              <Field label="CVC" value="" onChange={() => undefined} disabled />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">Review</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              <Item term="Name" value={`${form.firstName} ${form.lastName}`.trim() || "—"} />
              <Item term="Email" value={form.email || "—"} />
              <Item term="Company" value={form.company || "—"} />
              <Item term="Title" value={form.jobTitle || "—"} />
              <Item term="Attendee type" value={form.attendeeType} />
              <Item term="Interests" value={form.interests.join(", ") || "—"} />
            </dl>
            {form.challenge && <p className="mt-4 text-deep/80">{form.challenge}</p>}
            <label className="mt-6 flex items-start gap-3 text-navy/80">
              <input type="checkbox" disabled className="mt-1" />
              I agree to the event terms. This box unlocks when registration opens.
            </label>
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
            onClick={() => setStep((value) => Math.min(3, value + 1))}
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
            Submit registration
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
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  const id = label.toLowerCase().replaceAll(" ", "-");
  return (
    <label htmlFor={id}>
      <span className={labelClass}>{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={disabled ? "Opens with registration" : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
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
