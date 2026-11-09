export const differentiators = [
  {
    title: "Bring the real problem",
    body: "Show up with a packaging challenge or an innovation you can describe in specs, not slogans.",
  },
  {
    title: "Meet the right counterpart",
    body: "Southeastern companies sit with southeastern packaging providers who can actually do the work.",
  },
  {
    title: "Get into the lab",
    body: "Hands-on Packaging Labs, so a conversation can turn into a trial instead of a follow-up deck.",
  },
  {
    title: "Leave with a plan",
    body: "You walk out with a custom plan for the packaging goal you came in with.",
  },
] as const;

export const audiences = [
  {
    kicker: "Engineers",
    title: "Packaging engineers with a live challenge",
    body: "Materials, line performance, damage, cost, or a spec that is not surviving the supply chain.",
  },
  {
    kicker: "Providers",
    title: "Packaging providers with a solution that holds up",
    body: "If it runs, tests, or ships, this room wants the method and the result.",
  },
  {
    kicker: "Brands",
    title: "Brand and supply chain teams",
    body: "People who have to match a package to a plant, a lane, and a customer.",
  },
] as const;

export const pillars = [
  {
    title: "Expert speakers",
    image: "speakers.jpg",
    label: "Speaker photography",
    body: "People who have run the problem, not a tour of the category.",
  },
  {
    title: "Real brands",
    image: "brands.jpg",
    label: "Brand and supplier photography",
    body: "Southeastern companies and the providers who package for them.",
  },
  {
    title: "Packaging innovations",
    image: "labs.jpg",
    label: "Packaging lab photography",
    body: "Labs, materials, and formats you can inspect up close.",
  },
] as const;

export const venueShots = [
  {
    image: "exterior.jpg",
    label: "Madren exterior",
    caption: "Madren Conference Center",
  },
  {
    image: "interior.jpg",
    label: "Summit room",
    caption: "Meeting space",
  },
  {
    image: "grounds.jpg",
    label: "Lakeside grounds",
    caption: "Clemson University",
  },
] as const;

export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
};

export const faqs: FaqItem[] = [
  {
    id: "when-where",
    category: "Event",
    question: "When and where is the summit?",
    answer:
      "April 19–20, 2027 at the Madren Conference Center at Clemson University, 230 Madren Center Drive, Clemson, SC 29634. April 19 is a cocktail reception. April 20 is the one-day summit.",
  },
  {
    id: "who",
    category: "Event",
    question: "Who should attend?",
    answer:
      "Packaging engineers with a real challenge, packaging providers with an innovative solution, and brand and supply chain professionals. The point is to connect southeastern companies with southeastern packaging providers.",
  },
  {
    id: "different",
    category: "Program",
    question: "What makes this different from a typical conference?",
    answer:
      "You bring a packaging challenge or innovation, meet suppliers and brands that match that need, spend time in hands-on Packaging Labs, and leave with a custom plan.",
  },
  {
    id: "who-produces",
    category: "Event",
    question: "Who is producing it?",
    answer:
      "The Packaging School, the same team behind the Automotive Packaging Summit, which has sold out for the past 10 years. Headquarters are in Greenville, SC.",
  },
  {
    id: "registration",
    category: "Registration",
    question: "Is registration open, and what does it cost?",
    answer:
      "Registration is not open yet, and pricing has not been announced. Seating for this inaugural event is limited. The registration form on this site is a preview of the steps. It does not submit.",
  },
  {
    id: "included",
    category: "Registration",
    question: "What is included?",
    answer:
      "The published plan is a cocktail reception on April 19 and a one-day summit on April 20, including hands-on Packaging Labs. A full inclusion list will be posted when registration opens.",
  },
  {
    id: "speak",
    category: "Program",
    question: "How do I propose a talk?",
    answer:
      "Use the speaker interest form. Include the topic and what a packaging engineer should be able to do with it. The team follows up by email.",
  },
  {
    id: "sponsor",
    category: "Program",
    question: "How do I sponsor?",
    answer:
      "Use the sponsor interest form, or email info@packagingschool.com. Sponsorship details are still being set.",
  },
  {
    id: "agenda",
    category: "Program",
    question: "Is the agenda final?",
    answer:
      "Not yet. The agenda page shows published sessions for this event when they are in the system. Until then you will see the known shape of the two days, with times still to be announced.",
  },
  {
    id: "hotel",
    category: "Travel",
    question: "Is there a hotel block?",
    answer:
      "A room block has not been announced. The James F. Martin Inn is on site at the Conference Center and Inn. This page will list the block when it exists.",
  },
  {
    id: "getting-there",
    category: "Travel",
    question: "How do I get to Madren?",
    answer:
      "The center is on the Clemson University campus at 230 Madren Center Drive. Greenville-Spartanburg International (GSP) is the closest major airport, about an hour away. Charlotte (CLT) and Atlanta (ATL) are longer drives. On-site parking is available. Specific arrival details will be confirmed closer to the event.",
  },
  {
    id: "contact",
    category: "Contact",
    question: "Who do I contact?",
    answer:
      "Email info@packagingschool.com or call 864-412-5000. For the building itself, the Madren Center can be reached at 864-656-7155 or madren@clemson.edu.",
  },
];

export const previewSessions = [
  {
    id: "preview-reception",
    title: "Cocktail reception",
    description:
      "The inaugural evening. Session times and the run of show are still being set.",
    date: "2027-04-19",
    startTime: null,
    endTime: null,
    location: "Madren Conference Center",
    preview: true,
  },
  {
    id: "preview-summit",
    title: "One-day summit",
    description:
      "Talks and working conversations for packaging engineers, providers, and brand teams.",
    date: "2027-04-20",
    startTime: null,
    endTime: null,
    location: "Madren Conference Center",
    preview: true,
  },
  {
    id: "preview-labs",
    title: "Packaging Labs",
    description:
      "Hands-on time with relevant packaging labs. Stations will be published with the full agenda.",
    date: "2027-04-20",
    startTime: null,
    endTime: null,
    location: "Packaging Labs",
    preview: true,
  },
];
