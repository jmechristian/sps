import { Body, Button, Column, Container, Head, Hr, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { EVENT } from "@/lib/event";

const NAVY = "#15345e";
const DEEP = "#071e36";
const ORANGE = "#e54926";
const GOLD = "#f4aa00";
const GRAY_BG = "#f3f4f6";
const GRAY_BORDER = "#e5e7eb";
const DARK = "#111827";
const MUTED = "#6b7280";

const font = { fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif" };
const HEADER_BG = "https://autopacksummitapp94b14feadba64f23aff0ed8deae77b99bc6-dev.s3.us-east-1.amazonaws.com/public/email-header.png";

export type RegistrationEmailProps = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  attendeeLabel: string;
  registrationLabel: string;
  ticketPrice: number;
  total: number;
  coupon: string;
  dashboardUrl: string;
  agendaUrl: string;
  travelUrl: string;
  trackingUrl: string | null;
  logoUrl: string;
  calendars: { google: string; outlook: string; yahoo: string };
};

function money(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

export function RegistrationEmail({
  firstName,
  lastName,
  email,
  phone,
  company,
  jobTitle,
  attendeeLabel,
  registrationLabel,
  ticketPrice,
  total,
  coupon,
  dashboardUrl,
  agendaUrl,
  travelUrl,
  trackingUrl,
  logoUrl,
  calendars,
}: RegistrationEmailProps) {
  const name = `${firstName} ${lastName}`;

  return (
    <Html>
      <Head />
      <Preview>{`${firstName}, your registration for the Southeastern Packaging Summit has been received`}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: GRAY_BG, ...font }}>
        <Container style={{ maxWidth: "600px", width: "100%", margin: "0 auto", backgroundColor: "#ffffff", ...font }}>
          {trackingUrl ? <Img src={trackingUrl} width="1" height="1" alt="" style={{ display: "none" }} /> : null}

          <Section style={{ backgroundColor: GOLD, height: "6px", lineHeight: "6px", fontSize: "0" }}>&nbsp;</Section>
          <Section
            style={{
              backgroundColor: DEEP,
              backgroundImage: `url(${HEADER_BG})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "cover",
              padding: "28px 32px 32px",
              textAlign: "center",
            }}
          >
            <Img src={logoUrl} width="56" height="60" alt="Southeastern Packaging Summit" style={{ display: "block", margin: "0 auto 16px" }} />
            <Text style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: GOLD, ...font }}>
              The Packaging School
            </Text>
            <Text style={{ margin: "0 0 12px", fontSize: "30px", lineHeight: "1.15", fontWeight: 700, color: "#ffffff", ...font }}>
              Southeastern
              <br />
              Packaging Summit
            </Text>
            <Text style={{ margin: 0, fontSize: "14px", lineHeight: "1.5", color: "rgba(255,255,255,0.82)", ...font }}>
              {EVENT.dates}
              <br />
              {EVENT.venue} · Clemson, South Carolina
            </Text>
          </Section>
          <Section style={{ backgroundColor: ORANGE, height: "4px", lineHeight: "4px", fontSize: "0" }}>&nbsp;</Section>

          <Section style={{ padding: "36px 32px 0", textAlign: "center" }}>
            <Text style={{ fontSize: "24px", fontWeight: 700, color: DARK, margin: "0 0 12px", lineHeight: "1.3", ...font }}>
              {`${firstName}, your registration has been received and is PENDING.`}
            </Text>
            <Text style={{ fontSize: "15px", color: MUTED, margin: "0 0 24px", lineHeight: "1.5", ...font }}>
              View your dashboard to check the status of your registration. Your receipt is below.
            </Text>
            <Button href={dashboardUrl} style={{ backgroundColor: ORANGE, color: "#ffffff", padding: "12px 32px", borderRadius: "6px", fontSize: "14px", fontWeight: 700, textDecoration: "none", ...font }}>
              View Your Dashboard
            </Button>
          </Section>

          <Section style={{ padding: "32px 32px 0" }}>
            <Hr style={{ borderColor: GRAY_BORDER, margin: 0 }} />
          </Section>

          <Section style={{ padding: "28px 32px 0" }}>
            <Text style={{ fontSize: "11px", fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 16px", ...font }}>
              Order Summary
            </Text>
            <Row>
              <Column style={{ width: "50%", verticalAlign: "top" }}>
                <Text style={{ fontSize: "13px", fontWeight: 700, color: DARK, margin: "0 0 6px", ...font }}>Registrant</Text>
                <Text style={{ fontSize: "13px", color: DARK, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{name}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{jobTitle}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{company}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{email}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: 0, lineHeight: "1.5", ...font }}>{phone}</Text>
              </Column>
              <Column style={{ width: "50%", verticalAlign: "top" }}>
                <Text style={{ fontSize: "13px", fontWeight: 700, color: DARK, margin: "0 0 6px", ...font }}>Venue</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{EVENT.venue}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{EVENT.address}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 2px", lineHeight: "1.5", ...font }}>{EVENT.city}</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: 0, lineHeight: "1.5", ...font }}>{attendeeLabel}</Text>
              </Column>
            </Row>

            <Section style={{ marginTop: "20px" }}>
              <Section style={{ backgroundColor: GRAY_BG, borderRadius: "6px 6px 0 0", padding: "8px 12px" }}>
                <Row>
                  <Column style={{ width: "50%" }}>
                    <Text style={{ fontSize: "12px", fontWeight: 700, color: MUTED, margin: 0, ...font }}>Item</Text>
                  </Column>
                  <Column style={{ width: "25%", textAlign: "center" }}>
                    <Text style={{ fontSize: "12px", fontWeight: 700, color: MUTED, margin: 0, ...font }}>Qty</Text>
                  </Column>
                  <Column style={{ width: "25%", textAlign: "right" }}>
                    <Text style={{ fontSize: "12px", fontWeight: 700, color: MUTED, margin: 0, ...font }}>Amount</Text>
                  </Column>
                </Row>
              </Section>
              <Section style={{ padding: "10px 12px", borderBottom: `1px solid ${GRAY_BORDER}` }}>
                <Row>
                  <Column style={{ width: "50%" }}>
                    <Text style={{ fontSize: "13px", color: DARK, margin: 0, ...font }}>{registrationLabel}</Text>
                  </Column>
                  <Column style={{ width: "25%", textAlign: "center" }}>
                    <Text style={{ fontSize: "13px", color: DARK, margin: 0, ...font }}>1</Text>
                  </Column>
                  <Column style={{ width: "25%", textAlign: "right" }}>
                    <Text style={{ fontSize: "13px", color: DARK, margin: 0, ...font }}>{money(ticketPrice)}</Text>
                  </Column>
                </Row>
              </Section>
              {coupon ? (
                <Section style={{ padding: "10px 12px", borderBottom: `1px solid ${GRAY_BORDER}` }}>
                  <Row>
                    <Column style={{ width: "50%" }}>
                      <Text style={{ fontSize: "13px", color: DARK, margin: 0, ...font }}>{`Discount (${coupon})`}</Text>
                    </Column>
                    <Column style={{ width: "25%", textAlign: "center" }}>
                      <Text style={{ fontSize: "13px", color: DARK, margin: 0, ...font }}>1</Text>
                    </Column>
                    <Column style={{ width: "25%", textAlign: "right" }}>
                      <Text style={{ fontSize: "13px", color: DARK, margin: 0, ...font }}>-{money(ticketPrice)}</Text>
                    </Column>
                  </Row>
                </Section>
              ) : null}
              <Section style={{ backgroundColor: DEEP, borderRadius: "0 0 6px 6px", padding: "12px" }}>
                <Row>
                  <Column style={{ width: "50%" }}>
                    <Text style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0, ...font }}>Paid</Text>
                  </Column>
                  <Column style={{ width: "50%", textAlign: "right" }}>
                    <Text style={{ fontSize: "14px", fontWeight: 700, color: "#ffffff", margin: 0, ...font }}>{money(total)}</Text>
                  </Column>
                </Row>
              </Section>
            </Section>

            <Section style={{ textAlign: "center", padding: "20px 0 0" }}>
              <Button href={dashboardUrl} style={{ backgroundColor: NAVY, color: "#ffffff", padding: "10px 28px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, textDecoration: "none", ...font }}>
                Download Receipt
              </Button>
            </Section>
          </Section>

          <Section style={{ padding: "28px 32px 0" }}>
            <Hr style={{ borderColor: GRAY_BORDER, margin: 0 }} />
          </Section>

          <Section style={{ padding: "28px 32px 0" }}>
            <Text style={{ fontSize: "18px", fontWeight: 700, color: DARK, textAlign: "center", margin: "0 0 16px", ...font }}>Event Details &amp; Agenda</Text>
            <Section style={{ backgroundColor: GRAY_BG, borderRadius: "8px", padding: "20px" }}>
              <Row>
                <Column style={{ width: "50%", verticalAlign: "top", paddingRight: "8px" }}>
                  <Text style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 6px", textTransform: "uppercase", ...font }}>
                    Monday
                    <br />
                    April 19
                  </Text>
                  <Text style={{ fontSize: "13px", color: DARK, margin: "0 0 2px", lineHeight: "1.5", ...font }}>Facility tours, 12:00 PM</Text>
                  <Text style={{ fontSize: "13px", color: DARK, margin: 0, lineHeight: "1.5", ...font }}>Cocktail reception, 5:30 PM</Text>
                </Column>
                <Column style={{ width: "50%", verticalAlign: "top", paddingLeft: "8px" }}>
                  <Text style={{ fontSize: "13px", fontWeight: 700, color: NAVY, margin: "0 0 6px", textTransform: "uppercase", ...font }}>
                    Tuesday
                    <br />
                    April 20
                  </Text>
                  <Text style={{ fontSize: "13px", color: DARK, margin: "0 0 2px", lineHeight: "1.5", ...font }}>Breakfast and networking, 7:30 AM</Text>
                  <Text style={{ fontSize: "13px", color: DARK, margin: "0 0 2px", lineHeight: "1.5", ...font }}>Keynote and workshops</Text>
                  <Text style={{ fontSize: "13px", color: DARK, margin: 0, lineHeight: "1.5", ...font }}>Lunch and learn</Text>
                </Column>
              </Row>
            </Section>
            <Section style={{ textAlign: "center", padding: "16px 0 0" }}>
              <Button href={agendaUrl} style={{ backgroundColor: DEEP, color: "#ffffff", padding: "10px 24px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, textDecoration: "none", ...font }}>
                View Agenda
              </Button>
            </Section>
          </Section>

          <Section style={{ padding: "20px 32px 0", textAlign: "center" }}>
            <Text style={{ fontSize: "13px", color: MUTED, margin: 0, ...font }}>
              Add event to calendar:{" "}
              <Link href={calendars.google} style={{ color: NAVY, fontWeight: 600, textDecoration: "underline", ...font }}>
                Google
              </Link>
              {" | "}
              <Link href={calendars.outlook} style={{ color: NAVY, fontWeight: 600, textDecoration: "underline", ...font }}>
                Outlook
              </Link>
              {" | "}
              <Link href={calendars.yahoo} style={{ color: NAVY, fontWeight: 600, textDecoration: "underline", ...font }}>
                Yahoo
              </Link>
            </Text>
          </Section>

          <Section style={{ padding: "28px 32px 0" }}>
            <Hr style={{ borderColor: GRAY_BORDER, margin: 0 }} />
          </Section>

          <Section style={{ padding: "28px 32px 0" }}>
            <Row>
              <Column style={{ width: "50%", verticalAlign: "top", paddingRight: "12px" }}>
                <Text style={{ fontSize: "16px", fontWeight: 700, color: DARK, margin: "0 0 10px", ...font }}>Hotel and Travel</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 16px", lineHeight: "1.6", ...font }}>
                  A hotel block is not booked yet. The James F. Martin Inn is on the Madren property. Greenville-Spartanburg (GSP) is about an hour away, with Charlotte and Atlanta as longer options. On-site parking details will be confirmed closer to the summit.
                </Text>
                <Button href={travelUrl} style={{ backgroundColor: NAVY, color: "#ffffff", padding: "10px 22px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, textDecoration: "none", ...font }}>
                  Travel Details
                </Button>
              </Column>
              <Column style={{ width: "50%", verticalAlign: "top", paddingLeft: "12px" }}>
                <Text style={{ fontSize: "16px", fontWeight: 700, color: DARK, margin: "0 0 10px", ...font }}>The Summit</Text>
                <Text style={{ fontSize: "13px", color: MUTED, margin: "0 0 16px", lineHeight: "1.6", ...font }}>
                  April 19 is the cocktail reception and hands-on packaging tours. April 20 is the working summit. Seating for this inaugural event is limited. All times are Eastern.
                </Text>
                <Button href={dashboardUrl} style={{ backgroundColor: NAVY, color: "#ffffff", padding: "10px 22px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, textDecoration: "none", ...font }}>
                  View Dashboard
                </Button>
              </Column>
            </Row>
          </Section>

          <Section style={{ padding: "28px 32px 0" }}>
            <Hr style={{ borderColor: GRAY_BORDER, margin: "0 0 24px" }} />
            <Text style={{ fontSize: "16px", fontWeight: 700, color: DARK, margin: "0 0 10px", ...font }}>Registration Cancellation</Text>
            <Text style={{ fontSize: "13px", color: MUTED, margin: 0, lineHeight: "1.6", ...font }}>
              If your plans change, contact{" "}
              <Link href={`mailto:${EVENT.email}`} style={{ color: NAVY, textDecoration: "underline" }}>
                {EVENT.email}
              </Link>{" "}
              so we can keep the room count accurate. Seating for the inaugural summit is limited.
            </Text>
          </Section>

          <Section style={{ backgroundColor: NAVY, padding: "32px", marginTop: "32px", textAlign: "center" }}>
            <Text style={{ fontSize: "22px", fontWeight: 700, color: "#ffffff", margin: "0 0 12px", ...font }}>We&apos;ll see you in Clemson.</Text>
            <Text style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: "0 0 4px", lineHeight: "1.6", ...font }}>
              For event details, open your{" "}
              <Link href={dashboardUrl} style={{ color: GOLD, fontWeight: 700, textDecoration: "underline" }}>
                registrant dashboard
              </Link>
              .
            </Text>
            <Text style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", margin: 0, lineHeight: "1.6", ...font }}>
              Questions? Contact{" "}
              <Link href={`mailto:${EVENT.email}`} style={{ color: GOLD, fontWeight: 700, textDecoration: "underline" }}>
                {EVENT.email}
              </Link>
              .
            </Text>
          </Section>

          <Section style={{ padding: "16px 32px" }}>
            <Row>
              <Column style={{ verticalAlign: "middle" }}>
                <Img src="https://packschool.s3.us-east-1.amazonaws.com/ps-square150x.png" width="28" height="28" alt="The Packaging School" style={{ display: "inline-block" }} />
              </Column>
              <Column style={{ textAlign: "right", verticalAlign: "middle" }}>
                <Link href="https://www.packagingschool.com" style={{ textDecoration: "none" }}>
                  <Text style={{ fontSize: "11px", fontWeight: 700, color: NAVY, textTransform: "uppercase", letterSpacing: "0.5px", margin: 0, ...font }}>
                    Powered by PackagingSchool.com
                  </Text>
                </Link>
              </Column>
            </Row>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
