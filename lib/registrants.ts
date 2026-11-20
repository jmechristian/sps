import { cacheLife } from "next/cache";
import Stripe from "stripe";
import { appsyncClient } from "@/lib/appsync";
import { checkDiscountCode, consumeDiscountCode } from "@/lib/discount";
import { SPS_EVENT_ID } from "@/lib/event";

export const TICKET_PRICE = 799;

const ATTENDEE_TYPES = {
  brand: "OEM",
  provider: "SOLUTIONPROVIDER",
  sponsor: "SPONSOR",
} as const;

export type RegistrationAttendee = keyof typeof ATTENDEE_TYPES;

export const ATTENDEE_LABELS: Record<string, string> = {
  OEM: "Brand owners / packaging engineers / procurement",
  SOLUTIONPROVIDER: "Solution provider",
  SPONSOR: "Sponsor",
  SPEAKER: "Speaker",
  TIER1: "Tier 1",
  STAFF: "Staff",
  EXHIBITOR: "Exhibitor",
};

export type RegistrantRecord = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobTitle: string | null;
  company: string | null;
  attendeeType: string;
  interests: string[];
  otherInterest: string | null;
  packagingChallenge: string | null;
  buyerQuestion: string | null;
  totalAmount: number;
  discountCode: string | null;
  status: string;
  paymentConfirmation: string | null;
};

export type RegistrationInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  attendeeType: RegistrationAttendee;
  challenge: string;
  solution: string;
  opportunity: string;
  interests: string[];
  otherInterest: string;
  coupon: string;
  terms: boolean;
  paymentIntentId: string | null;
};

type GraphqlResult<T> = { data?: T; errors?: Array<{ message?: string }> };

async function graphql<T>(query: string, variables: Record<string, unknown>) {
  const api = appsyncClient();
  if (!api) throw new Error("Registration is unavailable right now.");
  const result = (await api.graphql({ query, variables, authMode: "apiKey" })) as GraphqlResult<T>;
  if (result.errors?.length) throw new Error(result.errors[0]?.message || "Registration is unavailable right now.");
  if (!result.data) throw new Error("Registration is unavailable right now.");
  return result.data;
}

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function registrationInput(body: Record<string, unknown>): RegistrationInput | null {
  const attendeeType = body.attendeeType;
  if (attendeeType !== "brand" && attendeeType !== "provider" && attendeeType !== "sponsor") return null;
  const interests = Array.isArray(body.interests)
    ? body.interests.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 24)
    : [];
  return {
    firstName: text(body.firstName, 80),
    lastName: text(body.lastName, 80),
    email: text(body.email, 160).toLowerCase(),
    phone: text(body.phone, 40),
    company: text(body.company, 160),
    jobTitle: text(body.jobTitle, 120),
    attendeeType,
    challenge: text(body.challenge, 2000),
    solution: text(body.solution, 2000),
    opportunity: text(body.opportunity, 2000),
    interests,
    otherInterest: text(body.otherInterest, 500),
    coupon: text(body.coupon, 80),
    terms: body.terms === true,
    paymentIntentId: text(body.paymentIntentId, 120) || null,
  };
}

function validate(input: RegistrationInput) {
  if (!input.firstName || !input.lastName || !input.phone || !input.company || !input.jobTitle) return "Fill in every contact field.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) return "Enter a valid email.";
  if (!input.terms) return "Accept the event terms to continue.";
  if (input.attendeeType === "brand" && !input.challenge) return "Describe the packaging challenge you are bringing.";
  if (input.attendeeType === "provider" && (!input.solution || !input.opportunity)) return "Describe the solution and the buying opportunity.";
  if (input.attendeeType === "sponsor" && !input.solution) return "Describe the solution you are bringing.";
  if (input.interests.includes("Other") && !input.otherInterest) return "Describe the other interest.";
  return null;
}

async function emailTaken(email: string) {
  const data = await graphql<{ apsRegistrantsByEmail?: { items?: Array<{ id: string } | null> | null } }>(
    `query Taken($email: String!, $eventId: ID!) {
      apsRegistrantsByEmail(email: $email, filter: { apsID: { eq: $eventId } }, limit: 1) { items { id } }
    }`,
    { email, eventId: SPS_EVENT_ID },
  );
  return (data.apsRegistrantsByEmail?.items ?? []).some(Boolean);
}

async function companyIdFor(name: string) {
  const found = await graphql<{ listAPSCompanies?: { items?: Array<{ id: string; name?: string | null } | null> | null } }>(
    `query FindCompany($name: String!) {
      listAPSCompanies(filter: { name: { eq: $name } }, limit: 5) { items { id name } }
    }`,
    { name },
  );
  const existing = (found.listAPSCompanies?.items ?? []).find((item) => item?.id);
  if (existing?.id) return existing.id;
  const created = await graphql<{ createAPSCompany?: { id: string } | null }>(
    `mutation CreateCompany($input: CreateAPSCompanyInput!) {
      createAPSCompany(input: $input) { id }
    }`,
    { input: { name } },
  );
  return created.createAPSCompany?.id ?? null;
}

async function paidIntent(paymentIntentId: string) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error("Card checkout is not configured.");
  const stripe = new Stripe(secret);
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const complete = intent.status === "succeeded" || intent.status === "processing" || intent.status === "requires_capture";
  if (!complete || intent.amount !== TICKET_PRICE * 100 || intent.currency !== "usd") {
    throw new Error("Payment was not completed.");
  }
  return intent.id;
}

export async function createRegistration(input: RegistrationInput) {
  const invalid = validate(input);
  if (invalid) return { ok: false as const, status: 400, error: invalid };
  if (await emailTaken(input.email)) return { ok: false as const, status: 409, error: "This email is already registered" };

  let discountCode: string | null = null;
  let totalAmount = TICKET_PRICE;
  if (input.coupon) {
    const checked = await checkDiscountCode(input.coupon);
    if (!checked.ok) return { ok: false as const, status: 400, error: checked.error };
    discountCode = input.coupon;
    totalAmount = 0;
  }

  let paymentConfirmation: string | null = null;
  if (totalAmount > 0) {
    if (!input.paymentIntentId) return { ok: false as const, status: 400, error: "Payment was not completed." };
    paymentConfirmation = await paidIntent(input.paymentIntentId);
  }

  const companyId = await companyIdFor(input.company);
  const created = await graphql<{ createApsRegistrant?: { id: string } | null }>(
    `mutation CreateRegistrant($input: CreateApsRegistrantInput!) {
      createApsRegistrant(input: $input) { id }
    }`,
    {
      input: {
        apsID: SPS_EVENT_ID,
        attendeeType: ATTENDEE_TYPES[input.attendeeType],
        status: "PENDING",
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        companyId,
        jobTitle: input.jobTitle,
        termsAccepted: true,
        interests: input.interests.length ? input.interests : null,
        otherInterest: input.otherInterest || null,
        packagingChallenge: input.attendeeType === "brand" ? input.challenge : input.solution || null,
        buyerQuestion: input.attendeeType === "provider" ? input.opportunity : null,
        totalAmount,
        discountCode,
        paymentConfirmation,
        sameAsAttendee: true,
      },
    },
  );
  const id = created.createApsRegistrant?.id;
  if (!id) throw new Error("Could not save the registration.");
  if (input.coupon) {
    const consumed = await consumeDiscountCode(input.coupon);
    if (!consumed.ok) console.error("SPS discount code was not counted", consumed.error);
  }
  return { ok: true as const, id };
}

const REGISTRANT_QUERY = /* GraphQL */ `
  query GetRegistrant($id: ID!) {
    getApsRegistrant(id: $id) {
      id
      apsID
      firstName
      lastName
      email
      phone
      jobTitle
      attendeeType
      interests
      otherInterest
      packagingChallenge
      buyerQuestion
      totalAmount
      discountCode
      status
      paymentConfirmation
      company { name }
    }
  }
`;

type RawRegistrant = {
  getApsRegistrant?: {
    id: string;
    apsID?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    jobTitle?: string | null;
    attendeeType?: string | null;
    interests?: Array<string | null> | null;
    otherInterest?: string | null;
    packagingChallenge?: string | null;
    buyerQuestion?: string | null;
    totalAmount?: number | null;
    discountCode?: string | null;
    status?: string | null;
    paymentConfirmation?: string | null;
    company?: { name?: string | null } | null;
  } | null;
};

export async function getRegistrant(id: string): Promise<RegistrantRecord | null> {
  "use cache";
  cacheLife("minutes");
  if (!id) return null;
  try {
    const data = await graphql<RawRegistrant>(REGISTRANT_QUERY, { id });
    const item = data.getApsRegistrant;
    if (!item || item.apsID !== SPS_EVENT_ID) return null;
    return {
      id: item.id,
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      email: item.email || "",
      phone: item.phone ?? null,
      jobTitle: item.jobTitle ?? null,
      company: item.company?.name ?? null,
      attendeeType: item.attendeeType || "",
      interests: (item.interests ?? []).filter((interest): interest is string => Boolean(interest)),
      otherInterest: item.otherInterest ?? null,
      packagingChallenge: item.packagingChallenge ?? null,
      buyerQuestion: item.buyerQuestion ?? null,
      totalAmount: item.totalAmount ?? 0,
      discountCode: item.discountCode ?? null,
      status: item.status || "PENDING",
      paymentConfirmation: item.paymentConfirmation ?? null,
    };
  } catch (error) {
    console.error("SPS registrant read failed", error);
    return null;
  }
}
