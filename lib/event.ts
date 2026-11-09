export const SPS_EVENT_ID =
  process.env.NEXT_PUBLIC_SPS_EVENT_ID ||
  "fb11dcfe-2e7d-4aaf-bf94-ff912b2254a8";

export const EVENT = {
  name: "Southeastern Packaging Summit",
  dates: "April 19–20, 2027",
  reception: "April 19, 2027",
  summit: "April 20, 2027",
  venue: "Madren Conference Center",
  campus: "Clemson University",
  address: "230 Madren Center Drive",
  city: "Clemson, SC 29634",
  email: "info@packagingschool.com",
  phone: "864-412-5000",
  venuePhone: "864-656-7155",
} as const;
