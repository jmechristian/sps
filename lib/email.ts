import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export async function sendInterestEmail(subject: string, lines: Array<[string, string]>) {
  const accessKeyId = process.env.AWSACCESSKEYID;
  const secretAccessKey = process.env.AWSSECRETACCESSKEY;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Email is not configured.");
  }

  const from = process.env.SES_FROM_ADDRESS || "info@packagingschool.com";
  const to = process.env.SES_TO_ADDRESS || "info@packagingschool.com";
  const reply = lines.find(([label]) => label.toLowerCase() === "email")?.[1];
  const text = lines.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `<div style="font-family:Raleway,Arial,sans-serif;color:#071e36;line-height:1.5">${lines
    .map(
      ([label, value]) =>
        `<p><strong style="letter-spacing:0.04em">${escapeHtml(label)}</strong><br/>${escapeHtml(value).replaceAll("\n", "<br/>")}</p>`,
    )
    .join("")}</div>`;

  const client = new SESClient({
    region: process.env.NEXT_PUBLIC_AWS_APPSYNC_REGION || "us-east-1",
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new SendEmailCommand({
      Source: from,
      Destination: { ToAddresses: [to] },
      ReplyToAddresses: reply ? [reply] : undefined,
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Text: { Data: text, Charset: "UTF-8" },
          Html: { Data: html, Charset: "UTF-8" },
        },
      },
    }),
  );
}
