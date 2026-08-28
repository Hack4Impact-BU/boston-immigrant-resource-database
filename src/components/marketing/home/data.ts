export const STATS = [
  {
    value: "30+",
    label: "Providers",
    icon: "users",
  },
  {
    value: "40+",
    label: "Services",
    icon: "resources",
  },
  {
    value: "500+",
    label: "Immigrants Served",
    icon: "users",
  },
  {
    value: "1000+",
    label: "Community Connections",
    icon: "globe",
  },
] as const;

export const PARTNER_LOGOS = [
  { src: "/img/city.png", alt: "City of Boston Immigrant Advancement" },
  { src: "/img/precor.png", alt: "PRECOR" },
  { src: "/img/fellowship.png", alt: "Fellowship" },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "BIRD helps us live out our commitment to 'love thy neighbor' in practice—so we can become a city of belonging, where no one is left searching alone.",
    name: "Rev. Kelly Fassett",
    title: "UniteBoston Executive Director",
    photo: "/img/testimonial-kelly.png",
  },
  {
    quote:
      "Too often, we're sending families to services that are already full. With BIRD, we'll finally have a clear, real-time picture of what's available...",
    name: "Pastor Melinda Priest",
    title: "Site Director of Immigrant Connection at Moline City",
    photo: "/img/testimonial-melinda.png",
  },
  {
    quote:
      "We wanted to make the platform simple enough for anyone to use, while still being powerful enough for providers to keep their listings current.",
    name: "Richard Tang",
    title: "Web Developer",
    photo: "/img/testimonial-richard.png",
  },
  {
    quote:
      "Having up-to-date resource information in one place has transformed how our team supports immigrant families every day.",
    name: "Maria Santos",
    title: "Community Outreach Coordinator",
  },
] as const;

export const FOR_PROVIDERS_FAQ = [
  {
    trigger: "How does my organization join BIRD?",
    content:
      "Providers can sign up by reaching out to us (via the Contact Us form), attending a tutorial session, and signing an MOU. Once approved, you'll be able to create and manage your organization's listings on BIRD and see other resources.",
  },
  {
    trigger: "What's expected of providers who join?",
    content:
      "Providers are expected to keep their service listings current, respond to inquiries in a timely manner, and participate in periodic check-ins to ensure information stays accurate.",
  },
  {
    trigger: "How often do I need to update my information?",
    content:
      "We recommend reviewing and updating your listings at least once a month, or whenever your service availability changes.",
  },
  {
    trigger: "Is there a cost to participate?",
    content:
      "There is no cost for qualifying immigrant-serving organizations in the Greater Boston area to participate in BIRD.",
  },
] as const;

export const GENERAL_FAQ = [
  {
    trigger: "What is BIRD?",
    content:
      "The Boston Immigrant Resource Dashboard (BIRD) is a real-time, online platform that helps immigrant-serving providers and communities quickly find up-to-date information on essential resources in Boston, such as legal aid, ESL classes, and workforce development.",
  },
  {
    trigger: "Who can use BIRD?",
    content:
      "BIRD is designed primarily for immigrant-facing providers (churches, nonprofits, city agencies, and community organizations).",
  },
  {
    trigger: "Why was BIRD created?",
    content:
      "Immigrant and refugee neighbors often face barriers to finding timely help. Existing resource lists and databases are often outdated. BIRD was created to close this gap by offering real-time updates using a simple green–yellow–red light system to show which services are available now.",
  },
] as const;
