import { previewRegistrationEmail } from "@/lib/registration-email";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(request.url);
  const html = await previewRegistrationEmail(url.origin, url.searchParams.has("discount"));
  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
