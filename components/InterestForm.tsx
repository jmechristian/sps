"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { buttonClass, fieldClass, labelClass } from "@/lib/styles";

type Field = {
  name: string;
  label: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  textarea?: boolean;
};

export function InterestForm({
  endpoint,
  fields,
  submitLabel,
  successTitle,
  successBody,
}: {
  endpoint: string;
  fields: Field[];
  submitLabel: string;
  successTitle: string;
  successBody: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(values: Record<string, string>) {
    setStatus("idle");
    setMessage("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setStatus("error");
        setMessage(data.error || "We could not send that. Email info@packagingschool.com and we will take it from there.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setMessage("The request did not go through. Check your connection, or email info@packagingschool.com.");
    }
  }

  return (
    <AnimatePresence mode="wait">
      {status === "success" ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-navy/10 bg-paper p-8"
          role="status"
        >
          <p className="font-display text-xs font-semibold uppercase tracking-[0.18em] text-orange">Received</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight">{successTitle}</h2>
          <p className="mt-3 max-w-xl leading-snug text-deep/80">{successBody}</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-3xl border border-navy/10 bg-paper p-6 md:p-8"
          noValidate
        >
          <div className="sr-only" aria-hidden>
            <label>
              Company website
              <input tabIndex={-1} autoComplete="off" {...register("companyWebsite")} />
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <div key={field.name} className={field.textarea ? "md:col-span-2" : undefined}>
                <label htmlFor={field.name} className={labelClass}>
                  {field.label}
                  {field.required ? " *" : ""}
                </label>
                {field.textarea ? (
                  <textarea
                    id={field.name}
                    rows={5}
                    aria-invalid={Boolean(errors[field.name])}
                    className={fieldClass}
                    {...register(field.name, { required: field.required ? "This field is required." : false })}
                  />
                ) : (
                  <input
                    id={field.name}
                    type={field.type || "text"}
                    aria-invalid={Boolean(errors[field.name])}
                    className={fieldClass}
                    {...register(field.name, {
                      required: field.required ? "This field is required." : false,
                      pattern:
                        field.type === "email"
                          ? { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email." }
                          : undefined,
                    })}
                  />
                )}
                {errors[field.name] && (
                  <p className="mt-2 text-orange" role="alert">
                    {String(errors[field.name]?.message)}
                  </p>
                )}
              </div>
            ))}
          </div>
          {status === "error" && (
            <p className="mt-5 rounded-xl bg-orange/10 px-4 py-3 text-orange-deep" role="alert">
              {message}
            </p>
          )}
          <button type="submit" className={`${buttonClass} mt-6`} disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : submitLabel}
          </button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
