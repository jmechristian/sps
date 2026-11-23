import { render } from "@react-email/render";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { appsyncClient } from "@/lib/appsync";
import { RegistrationEmail } from "@/emails/RegistrationEmail";
import { EVENT, SPS_EVENT_ID } from "@/lib/event";
import { ATTENDEE_LABELS, TICKET_PRICE, type RegistrationInput } from "@/lib/registrants";

const FROM = "bianca@packagingschool.com";
const BCC = ["bianca@packagingschool.com", "lars@packagingschool.com"];

const EVENT_START = "20270419T160000Z";
const EVENT_END = "20270420T163000Z";

type GraphqlResult<T> = { data?: T; errors?: Array<{ message?: string }> };

function money(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

function registrationLabel(attendeeType: RegistrationInput["attendeeType"]) {
  if (attendeeType === "sponsor") return "Sponsor registration";
  if (attendeeType === "provider") return "Solution provider registration";
  return "General registration";
}

async function graphql<T>(query: string, variables: Record<string, unknown>) {
  const api = appsyncClient();
  if (!api) throw new Error("Registration is unavailable right now.");
  const result = (await api.graphql({ query, variables, authMode: "apiKey" })) as GraphqlResult<T>;
  if (result.errors?.length) throw new Error(result.errors[0]?.message || "Could not update the registration.");
  return result.data;
}

function calendarLinks(dashboardUrl: string) {
  const title = EVENT.name;
  const location = `${EVENT.venue}, ${EVENT.address}, ${EVENT.city}`;
  const details = `Reception and tours on April 19, then the summit on April 20. All times Eastern. ${dashboardUrl}`;
  const encodedTitle = encodeURIComponent(title);
  const encodedLocation = encodeURIComponent(location);
  const encodedDetails = encodeURIComponent(details);
  return {
    google: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodedTitle}&dates=${EVENT_START}/${EVENT_END}&location=${encodedLocation}&details=${encodedDetails}`,
    outlook: `https://outlook.live.com/calendar/0/action/compose?subject=${encodedTitle}&startdt=2027-04-19T12:00:00&enddt=2027-04-20T12:30:00&location=${encodedLocation}&body=${encodedDetails}`,
    yahoo: `https://calendar.yahoo.com/?v=60&title=${encodedTitle}&st=${EVENT_START}&et=${EVENT_END}&in_loc=${encodedLocation}&desc=${encodedDetails}`,
  };
}

function attendeeLabel(attendeeType: RegistrationInput["attendeeType"]) {
  if (attendeeType === "provider") return ATTENDEE_LABELS.SOLUTIONPROVIDER;
  if (attendeeType === "sponsor") return ATTENDEE_LABELS.SPONSOR;
  return ATTENDEE_LABELS.OEM;
}

async function emailHtml(input: RegistrationInput, id: string, origin: string, track = true) {
  const dashboardUrl = `${origin}/registrants/${id}`;
  return render(
    <RegistrationEmail
      firstName={input.firstName}
      lastName={input.lastName}
      email={input.email}
      phone={input.phone}
      company={input.company}
      jobTitle={input.jobTitle}
      attendeeLabel={attendeeLabel(input.attendeeType)}
      registrationLabel={registrationLabel(input.attendeeType)}
      ticketPrice={TICKET_PRICE}
      total={input.coupon ? 0 : TICKET_PRICE}
      coupon={input.coupon}
      dashboardUrl={dashboardUrl}
      agendaUrl={`${origin}/agenda`}
      travelUrl={`${origin}/travel`}
      trackingUrl={track ? `${origin}/api/email-open?id=${encodeURIComponent(id)}` : null}
      logoUrl={`${origin}/mark-on-dark.png`}
      calendars={calendarLinks(dashboardUrl)}
    />,
    { pretty: false },
  );
}

function emailText(input: RegistrationInput, id: string, origin: string) {
  const total = input.coupon ? 0 : TICKET_PRICE;
  const dashboardUrl = `${origin}/registrants/${id}`;
  return [
    `${input.firstName}, your registration for the ${EVENT.name} has been received and is pending.`,
    `View your dashboard: ${dashboardUrl}`,
    `${registrationLabel(input.attendeeType)}: ${money(TICKET_PRICE)}`,
    input.coupon ? `Discount (${input.coupon}): -${money(TICKET_PRICE)}` : "",
    `Paid: ${money(total)}`,
    `${EVENT.dates} · ${EVENT.venue}, ${EVENT.address}, ${EVENT.city}`,
  ]
    .filter(Boolean)
    .join("\n");
}

async function markRegistrationEmailSent(id: string) {
  await graphql(
    `mutation MarkSent($input: UpdateApsRegistrantInput!) {
      updateApsRegistrant(input: $input) { id }
    }`,
    {
      input: {
        id,
        registrationEmailSent: true,
        registrationEmailSentDate: new Date().toISOString(),
      },
    },
  );
}

export async function markRegistrationEmailOpened(id: string) {
  const data = await graphql<{ getApsRegistrant?: { id: string; apsID?: string | null } | null }>(
    `query RegistrantEvent($id: ID!) { getApsRegistrant(id: $id) { id apsID } }`,
    { id },
  );
  if (data?.getApsRegistrant?.apsID !== SPS_EVENT_ID) return;
  await graphql(
    `mutation MarkOpened($input: UpdateApsRegistrantInput!) {
      updateApsRegistrant(input: $input) { id }
    }`,
    {
      input: {
        id,
        registrationEmailReceived: true,
        registrationEmailReceivedDate: new Date().toISOString(),
      },
    },
  );
}

function sesClient() {
  const accessKeyId = process.env.AWSACCESSKEYID;
  const secretAccessKey = process.env.AWSSECRETACCESSKEY;
  return new SESClient({
    region: process.env.NEXT_PUBLIC_AWS_APPSYNC_REGION || "us-east-1",
    credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
  });
}

export async function previewRegistrationEmail(origin: string, discount = false) {
  const sample: RegistrationInput = {
    firstName: "Alex",
    lastName: "Morgan",
    email: "alex.morgan@example.com",
    phone: "864-555-0199",
    company: "Piedmont Brands",
    jobTitle: "Packaging Engineer",
    attendeeType: "brand",
    challenge: "A mailer that survives a two-day regional lane.",
    solution: "",
    opportunity: "",
    interests: ["Paper and corrugated"],
    otherInterest: "",
    coupon: discount ? "SOUTHEAST" : "",
    terms: true,
    paymentIntentId: null,
  };
  return emailHtml(sample, "preview", origin, false);
}

export async function sendRegistrationEmail(input: RegistrationInput, id: string, origin: string) {
  const client = sesClient();

  await client.send(
    new SendEmailCommand({
      Source: FROM,
      Destination: {
        ToAddresses: [input.email],
        BccAddresses: BCC,
      },
      Message: {
        Subject: { Data: `${EVENT.name} 2027 – Registration Received`, Charset: "UTF-8" },
        Body: {
          Html: { Data: await emailHtml(input, id, origin), Charset: "UTF-8" },
          Text: { Data: emailText(input, id, origin), Charset: "UTF-8" },
        },
      },
    }),
  );

  try {
    await markRegistrationEmailSent(id);
  } catch (error) {
    console.error("SPS registration email sent, but the sent flag was not saved", error);
  }
}
