import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { appsyncClient } from "@/lib/appsync";
import { EVENT, SPS_EVENT_ID } from "@/lib/event";
import { ATTENDEE_LABELS, TICKET_PRICE, type RegistrationInput } from "@/lib/registrants";

const FROM = "bianca@packagingschool.com";
const BCC = ["bianca@packagingschool.com", "lars@packagingschool.com"];

const NAVY = "#15345e";
const DEEP = "#071e36";
const ORANGE = "#e54926";
const GOLD = "#f4aa00";
const CREAM = "#f7f4ef";
const MUTED = "#5c6b7a";

const EVENT_START = "20270419T160000Z";
const EVENT_END = "20270420T163000Z";

type GraphqlResult<T> = { data?: T; errors?: Array<{ message?: string }> };

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

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

function emailHtml(input: RegistrationInput, id: string, origin: string) {
  const total = input.coupon ? 0 : TICKET_PRICE;
  const label = registrationLabel(input.attendeeType);
  const typeLabel = ATTENDEE_LABELS[input.attendeeType === "brand" ? "OEM" : input.attendeeType === "provider" ? "SOLUTIONPROVIDER" : "SPONSOR"];
  const dashboardUrl = `${origin}/registrants/${id}`;
  const agendaUrl = `${origin}/agenda`;
  const trackingUrl = `${origin}/api/email-open?id=${encodeURIComponent(id)}`;
  const calendars = calendarLinks(dashboardUrl);
  const name = `${input.firstName} ${input.lastName}`;
  const discountRow = input.coupon
    ? `<tr><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:${DEEP};">Discount (${escapeHtml(input.coupon)})</td><td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:${DEEP};text-align:right;">-${money(TICKET_PRICE)}</td></tr>`
    : "";

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${CREAM};">
    <img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;">
            <tr>
              <td style="background:${DEEP};padding:32px 28px;">
                <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:${GOLD};">${EVENT.dates}</p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:28px;line-height:1.15;font-weight:700;color:#f7f4ef;">${EVENT.name}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px 8px;font-family:Arial,sans-serif;color:${DEEP};">
                <p style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;">${escapeHtml(input.firstName)}, your registration has been received and is pending.</p>
                <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:${MUTED};">View your dashboard to check the status of your registration. The receipt is included below.</p>
                <a href="${dashboardUrl}" style="display:inline-block;background:${ORANGE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 24px;border-radius:999px;">View your dashboard</a>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <p style="margin:0 0 12px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:${NAVY};font-weight:700;">Registrant</p>
                <p style="margin:0;font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:${DEEP};"><strong>${escapeHtml(name)}</strong><br/>${escapeHtml(input.jobTitle)}<br/>${escapeHtml(input.company)}<br/>${escapeHtml(input.email)}<br/>${escapeHtml(input.phone)}<br/>${escapeHtml(typeLabel)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border:1px solid #e5e7eb;font-family:Arial,sans-serif;">
                  <tr>
                    <td style="padding:8px 12px;background:${CREAM};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Item</td>
                    <td style="padding:8px 12px;background:${CREAM};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};text-align:right;">Amount</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:${DEEP};">${escapeHtml(label)} – ${escapeHtml(name)}</td>
                    <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:14px;color:${DEEP};text-align:right;">${money(TICKET_PRICE)}</td>
                  </tr>
                  ${discountRow}
                  <tr>
                    <td style="padding:12px;background:${DEEP};font-size:14px;font-weight:700;color:#ffffff;">Paid</td>
                    <td style="padding:12px;background:${DEEP};font-size:14px;font-weight:700;color:#ffffff;text-align:right;">${money(total)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 28px;font-family:Arial,sans-serif;color:${DEEP};">
                <p style="margin:0 0 8px;font-size:18px;font-weight:700;">Event details</p>
                <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">April 19 is the cocktail reception and tours. April 20 is the one-day summit. All times are Eastern.<br/>${EVENT.venue}<br/>${EVENT.address}<br/>${EVENT.city}</p>
                <p style="margin:0 0 16px;font-size:14px;"><a href="${agendaUrl}" style="color:${ORANGE};font-weight:700;">View the agenda</a></p>
                <p style="margin:0;font-size:14px;color:${MUTED};">Add it to your calendar: <a href="${calendars.google}" style="color:${NAVY};">Google</a> · <a href="${calendars.outlook}" style="color:${NAVY};">Outlook</a> · <a href="${calendars.yahoo}" style="color:${NAVY};">Yahoo</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;background:${CREAM};font-family:Arial,sans-serif;font-size:13px;line-height:1.5;color:${MUTED};">
                The Packaging School<br/>
                <a href="mailto:${EVENT.email}" style="color:${NAVY};">${EVENT.email}</a> · ${EVENT.phone}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
          Html: { Data: emailHtml(input, id, origin), Charset: "UTF-8" },
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
