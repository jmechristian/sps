import type { Metadata } from "next";
import { InterestForm } from "@/components/InterestForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Speak",
  description: "Propose a talk for the Southeastern Packaging Summit.",
};

const fields = [
  { name: "fullname", label: "Full name", required: true },
  { name: "company", label: "Company", required: true },
  { name: "title", label: "Job title", required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  {
    name: "description",
    label: "Topic",
    required: true,
    textarea: true,
  },
  {
    name: "objectives",
    label: "What should an engineer leave knowing?",
    required: true,
    textarea: true,
  },
];

export default function SpeakPage() {
  return (
    <>
      <PageHeader
        eyebrow="Call for content"
        title="Speak"
        accent="to engineers."
        lede="If you have a packaging problem you have solved, a method you can defend, or a lab result worth putting in front of engineers, send it. The team reads every note."
      />
      <div className="mx-auto max-w-3xl px-5 py-20">
        <InterestForm
          endpoint="/api/speak"
          fields={fields}
          submitLabel="Send speaker interest"
          successTitle="We have your topic."
          successBody="A note is on its way to the Packaging School team. They will follow up at the email you gave us."
        />
      </div>
    </>
  );
}
