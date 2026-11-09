import type { Metadata } from "next";
import { FaqList } from "@/components/FaqList";
import { PageHeader } from "@/components/PageHeader";
import { faqs } from "@/lib/content";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Dates, audience, labs, registration, travel, and contact for the Southeastern Packaging Summit.",
};

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Before you book anything"
        title="Questions"
        accent="we can answer."
        lede="Dates, who it is for, and what is still being set. If it is not on this list, it has not been decided."
      />
      <div className="mx-auto max-w-3xl px-5 py-20">
        <FaqList items={faqs} />
      </div>
    </>
  );
}
