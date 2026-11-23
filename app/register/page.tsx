import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { RegisterWizard } from "@/components/RegisterWizard";

export const metadata: Metadata = {
  title: "Register",
  description: "Register for the Southeastern Packaging Summit. $799, with three seats per company and one seat per solution provider.",
};

export default function RegisterPage() {
  return (
    <>
      <PageHeader
        eyebrow="April 19–20, 2027"
        title="Register"
        accent="for $799."
        lede="Three registrations per company. Solution providers are limited to one. One coupon per company, and an added seat can be purchased at the full price."
      />
      <div className="mx-auto max-w-6xl px-5 py-20">
        <RegisterWizard />
      </div>
    </>
  );
}
