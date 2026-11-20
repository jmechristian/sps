import type { Metadata } from "next";
import { AgendaBoard } from "@/components/AgendaBoard";
import { PageHeader } from "@/components/PageHeader";
import { getEventContent } from "@/lib/appsync";
import { previewSessions } from "@/lib/content";

export const metadata: Metadata = {
  title: "Agenda",
  description: "April 19 cocktail reception and April 20 one-day summit at the Madren Conference Center.",
};

export default async function AgendaPage() {
  const { sessions } = await getEventContent();
  const published = sessions.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="April 19–20, 2027"
        title="Agenda"
        accent="for both days."
        lede="Reception and tours on April 19, then the working summit on April 20. Sessions below are the published agenda. All times are Eastern."
      />
      <div className="mx-auto max-w-6xl px-5 py-20">
        <AgendaBoard sessions={published ? sessions : previewSessions} preview={!published} />
      </div>
    </>
  );
}
