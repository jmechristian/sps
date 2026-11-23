import { NextResponse } from "next/server";
import { markRegistrationEmailOpened } from "@/lib/registration-email";

const PIXEL = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim() || "";
  if (id) {
    try {
      await markRegistrationEmailOpened(id);
    } catch (error) {
      console.error("SPS registration email open was not recorded", error);
    }
  }

  return new NextResponse(PIXEL, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
    },
  });
}
