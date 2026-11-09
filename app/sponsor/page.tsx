import type { Metadata } from "next";
import { InterestForm } from "@/components/InterestForm";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "Sponsor",
  description: "Tell the Packaging School you want to sponsor the Southeastern Packaging Summit.",
};

const fields = [
  { name: "name", label: "Full name", required: true },
  { name: "email", label: "Email", type: "email" as const, required: true },
  { name: "phone", label: "Phone", type: "tel" as const, required: true },
  { name: "company", label: "Company", required: true },
  { name: "title", label: "Job title", required: true },
];

export default function SponsorPage() {
  return (
    <>
      <PageHeader
        eyebrow="Sponsorship"
        title="Get in front of"
        accent="the people who specify."
        lede="Sponsors meet packaging engineers and brand teams who are in the room with a real challenge. Tell us who you are and the team will follow up with what is available."
      />
      <div className="mx-auto max-w-3xl px-5 py-20">
        <InterestForm
          endpoint="/api/sponsor"
          fields={fields}
          submitLabel="Send sponsor interest"
          successTitle="You are on the list."
          successBody="The Packaging School team will follow up by email with sponsorship details."
        />
      </div>
    </>
  );
}
