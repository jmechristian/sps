import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RegisterWizard } from "@/components/RegisterWizard";

export const metadata: Metadata = {
  title: "Register",
  description: "Registration for the Southeastern Packaging Summit is not open yet. Preview the attendee form.",
};

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        eyebrow="Not open yet"
        title="Register"
        accent="when seats open."
        lede="Same four steps attendees will use: who you are, what you need from the room, payment, and confirmation. Submit stays off until pricing and registration are live."
      />
      <div className="mx-auto max-w-4xl px-5 py-20">
        <RegisterWizard />
      </div>
    </>
  );
}
