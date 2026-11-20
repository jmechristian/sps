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

type DiscountMatch = { id: string; code: string; limit: number | null; used: number };

async function findDiscountCode(raw: string): Promise<{ ok: true; match: DiscountMatch } | { ok: false; error: string }> {
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
        return { ok: true, match: { id: match.id, code: match.code || raw.trim(), limit: match.limit ?? null, used } };
      }
      nextToken = page?.nextToken || null;
    } while (nextToken);

    return { ok: false, error: "Invalid discount code" };
  } catch (error) {
    console.error("SPS discount code lookup failed", error);
    return { ok: false, error: "Could not check that code. Try again." };
  }
}

export async function checkDiscountCode(raw: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const found = await findDiscountCode(raw);
  if (!found.ok) return found;
  return { ok: true };
}

const CODE_READ = /* GraphQL */ `
  query GetSPSCode($id: ID!) {
    getAPSCode(id: $id) {
      id
      used
      limit
    }
  }
`;

const CODE_UPDATE = /* GraphQL */ `
  mutation UseSPSCode($input: UpdateAPSCodeInput!) {
    updateAPSCode(input: $input) {
      id
      used
    }
  }
`;

export async function consumeDiscountCode(raw: string) {
  const found = await findDiscountCode(raw);
  if (!found.ok) return found;
  const api = appsyncClient();
  if (!api) return { ok: false as const, error: "Discount codes are unavailable right now." };

  const latest = (await api.graphql({
    query: CODE_READ,
    variables: { id: found.match.id },
    authMode: "apiKey",
  })) as { data?: { getAPSCode?: { id: string; used?: number | null; limit?: number | null } | null } };
  const code = latest.data?.getAPSCode;
  if (!code?.id) return { ok: false as const, error: "Invalid discount code" };
  const used = code.used || 0;
  if (code.limit != null && used + 1 > code.limit) {
    return { ok: false as const, error: `This code has reached its usage limit (${used}/${code.limit} used)` };
  }
  await api.graphql({
    query: CODE_UPDATE,
    variables: { input: { id: code.id, used: used + 1 } },
    authMode: "apiKey",
  });
  return { ok: true as const, code: found.match.code };
}
