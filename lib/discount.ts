import { appsyncClient } from "@/lib/appsync";
import { SPS_EVENT_ID } from "@/lib/event";

const QUERY = /* GraphQL */ `
  query SPSCodes($eventId: ID!, $nextToken: String) {
    aPSCodesByEventId(eventId: $eventId, limit: 200, nextToken: $nextToken) {
      items {
        id
        code
        limit
        used
      }
      nextToken
    }
  }
`;

type CodePage = {
  aPSCodesByEventId?: {
    items?: Array<{ id: string; code?: string | null; limit?: number | null; used?: number | null } | null> | null;
    nextToken?: string | null;
  } | null;
};

export function normalizeDiscountCode(code: string) {
  return code
    .trim()
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .toLowerCase();
}

export async function checkDiscountCode(raw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = normalizeDiscountCode(raw);
  if (!normalized) return { ok: false, error: "Please enter a discount code" };

  const api = appsyncClient();
  if (!api) return { ok: false, error: "Discount codes are unavailable right now." };

  let nextToken: string | null = null;
  try {
    do {
      const result = (await api.graphql({
        query: QUERY,
        variables: { eventId: SPS_EVENT_ID, nextToken },
        authMode: "apiKey",
      })) as { data?: CodePage };
      const page = result.data?.aPSCodesByEventId;
      const match = (page?.items ?? []).find((item) => item?.code && normalizeDiscountCode(item.code) === normalized);
      if (match) {
        const used = match.used || 0;
        if (match.limit != null && used + 1 > match.limit) {
          return { ok: false, error: `This code has reached its usage limit (${used}/${match.limit} used)` };
        }
        return { ok: true };
      }
      nextToken = page?.nextToken || null;
    } while (nextToken);

    return { ok: false, error: "Invalid discount code" };
  } catch (error) {
    console.error("SPS discount code lookup failed", error);
    return { ok: false, error: "Could not check that code. Try again." };
  }
}
