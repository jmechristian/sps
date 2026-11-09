import { cacheLife } from "next/cache";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/api";
import { SPS_EVENT_ID } from "./event";

export type Speaker = {
  id: string;
  presentationTitle: string | null;
  presentationSummary: string | null;
  name: string;
  company: string | null;
  jobTitle: string | null;
  photo: string | null;
};

export type Sponsor = {
  id: string;
  name: string;
  logo: string | null;
  website: string | null;
  type: string | null;
};

export type SessionItem = {
  id: string;
  title: string;
  description: string | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  location: string | null;
  preview?: boolean;
};

const QUERY = /* GraphQL */ `
  query SpsEvent($eventId: ID!) {
    apsAgendaByEventId(eventId: $eventId, limit: 5) {
      items {
        id
        items(limit: 200) {
          items {
            id
            title
            description
            date
            startTime
            endTime
            location
            draft
          }
        }
      }
    }
    aPSSpeakersByEventId(eventId: $eventId, limit: 80) {
      items {
        id
        presentationTitle
        presentationSummary
        profile {
          firstName
          lastName
          company
          jobTitle
          profilePicture
        }
      }
    }
    apsSponsorsByEventId(eventId: $eventId, limit: 80) {
      items {
        id
        type
        company {
          name
          logo
          website
        }
      }
    }
  }
`;

type Raw = {
  apsAgendaByEventId?: {
    items: Array<{
      id: string;
      items?: {
        items: Array<{
          id: string;
          title?: string | null;
          description?: string | null;
          date?: string | null;
          startTime?: string | null;
          endTime?: string | null;
          location?: string | null;
          draft?: boolean | null;
        } | null> | null;
      } | null;
    } | null> | null;
  } | null;
  aPSSpeakersByEventId?: {
    items: Array<{
      id: string;
      presentationTitle?: string | null;
      presentationSummary?: string | null;
      profile?: {
        firstName?: string | null;
        lastName?: string | null;
        company?: string | null;
        jobTitle?: string | null;
        profilePicture?: string | null;
      } | null;
    } | null> | null;
  } | null;
  apsSponsorsByEventId?: {
    items: Array<{
      id: string;
      type?: string | null;
      company?: {
        name?: string | null;
        logo?: string | null;
        website?: string | null;
      } | null;
    } | null> | null;
  } | null;
};

let configured = false;

function client() {
  const endpoint = process.env.NEXT_PUBLIC_AWS_APPSYNC_GRAPHQL_ENDPOINT;
  const apiKey = process.env.NEXT_PUBLIC_AWS_APPSYNC_API_KEY;
  if (!endpoint || !apiKey) return null;
  if (!configured) {
    Amplify.configure({
      API: {
        GraphQL: {
          endpoint,
          region: process.env.NEXT_PUBLIC_AWS_APPSYNC_REGION || "us-east-1",
          apiKey,
          defaultAuthMode: "apiKey",
        },
      },
    });
    configured = true;
  }
  return generateClient();
}

function httpUrl(value: string | null | undefined) {
  if (!value) return null;
  return value.startsWith("http") ? value : null;
}

export async function getEventContent() {
  "use cache";
  cacheLife("minutes");
  const empty = { speakers: [] as Speaker[], sponsors: [] as Sponsor[], sessions: [] as SessionItem[] };
  const api = client();
  if (!api) return empty;

  try {
    const result = await api.graphql({
      query: QUERY,
      variables: { eventId: SPS_EVENT_ID },
      authMode: "apiKey",
    });
    if (!("data" in result) || !result.data) return empty;
    const data = result.data as Raw;

    const sessions = (data.apsAgendaByEventId?.items ?? [])
      .flatMap((agenda) => agenda?.items?.items ?? [])
      .filter((item): item is NonNullable<typeof item> => Boolean(item && item.draft !== true && item.date && item.title))
      .map((item) => ({
        id: item.id,
        title: item.title || "Session",
        description: item.description ?? null,
        date: (item.date || "").slice(0, 10),
        startTime: item.startTime ?? null,
        endTime: item.endTime ?? null,
        location: item.location ?? null,
      }))
      .sort((a, b) => (a.date + (a.startTime || "")).localeCompare(b.date + (b.startTime || "")));

    const speakers = (data.aPSSpeakersByEventId?.items ?? [])
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((item) => {
        const name = [item.profile?.firstName, item.profile?.lastName].filter(Boolean).join(" ");
        return {
          id: item.id,
          presentationTitle: item.presentationTitle ?? null,
          presentationSummary: item.presentationSummary ?? null,
          name: name || "Speaker",
          company: item.profile?.company ?? null,
          jobTitle: item.profile?.jobTitle ?? null,
          photo: httpUrl(item.profile?.profilePicture),
        };
      });

    const sponsors = (data.apsSponsorsByEventId?.items ?? [])
      .filter((item): item is NonNullable<typeof item> => Boolean(item?.company?.name))
      .map((item) => ({
        id: item.id,
        name: item.company?.name || "Sponsor",
        logo: httpUrl(item.company?.logo),
        website: item.company?.website ?? null,
        type: item.type ?? null,
      }));

    return { speakers, sponsors, sessions };
  } catch (error) {
    console.error("SPS AppSync read failed", error);
    return empty;
  }
}
