/**
 * Default theme configurations for all 6 landing page themes.
 *
 * These serve two purposes:
 *  1. Fallback when the DB has no active theme or a theme row has no config
 *  2. Base that is deep-merged with DB config (DB values win)
 *
 * Palette values override the CSS variables defined in globals.css via
 * inline style on the LandingTemplate wrapper element.
 */

// All 7 event type definitions — each theme picks a subset via eventTypeKeys
export const ALL_EVENT_TYPES = {
  wedding: {
    icon: "💍",
    name: "Wedding Suite",
    detail: "Mehndi · Haldi · Sangeet · Wedding · Reception",
    photo: "https://images.pexels.com/photos/33006935/pexels-photo-33006935.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Elegant Sikh wedding ceremony",
  },
  birthday: {
    icon: "🎂",
    name: "Birthday Bash",
    detail: "Milestone birthdays & 1st celebrations",
    photo: "https://images.pexels.com/photos/19962115/pexels-photo-19962115.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Indian birthday celebration",
  },
  diwali: {
    icon: "🪔",
    name: "Diwali Party",
    detail: "Festival gatherings with your community",
    photo: "https://images.pexels.com/photos/7686304/pexels-photo-7686304.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Family celebrating Diwali with sparklers",
  },
  puja: {
    icon: "🙏",
    name: "Puja & Ceremony",
    detail: "Satyanarayan, Griha Pravesh & more",
    photo: "https://images.pexels.com/photos/7685983/pexels-photo-7685983.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Mother and daughter performing puja ritual",
  },
  namkaran: {
    icon: "👶",
    name: "Namkaran",
    detail: "Welcome your little one with family",
    photo: "https://images.pexels.com/photos/7686327/pexels-photo-7686327.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Indian family gathering for ceremony",
  },
  godh_bharai: {
    icon: "🌸",
    name: "Godh Bharai",
    detail: "Baby showers, the desi way",
    photo: "https://images.pexels.com/photos/8819763/pexels-photo-8819763.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Family celebration with gifts in traditional attire",
  },
  graduation: {
    icon: "🎓",
    name: "Graduation",
    detail: "Celebrate the milestone with everyone",
    photo: "https://images.pexels.com/photos/35077186/pexels-photo-35077186.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Family birthday celebration outdoors",
  },
  holi: {
    icon: "🎨",
    name: "Holi Celebration",
    detail: "Colors, music & community joy",
    photo: "https://images.pexels.com/photos/18230345/pexels-photo-18230345.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Friends celebrating Holi with colors",
  },
  navratri: {
    icon: "💃",
    name: "Navratri / Garba",
    detail: "Garba & dandiya nights",
    photo: "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Garba dancers in traditional dress",
  },
  anniversary: {
    icon: "💑",
    name: "Anniversary",
    detail: "Silver, golden & ruby milestones",
    photo: "https://images.pexels.com/photos/15662086/pexels-photo-15662086.jpeg?auto=compress&cs=tinysrgb&w=800",
    photoAlt: "Couple celebrating their anniversary",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme: Wedding (default — warm gold, current palette)
// ─────────────────────────────────────────────────────────────────────────────
const WEDDING = {
  name: "wedding",
  displayName: "Weddings & Marriage Events",
  palette: {
    accent:     "#c9941a",
    accentHover:"#a87a14",
    accentDim:  "rgba(201, 148, 26, 0.12)",
    bg:         "#faf7f2",
    accentDeep: "#8b4513",
  },
  hero: {
    badge:       "Built for Indian weddings",
    headline:    "Plan the functions.\nGather the family.\nWe'll handle the rest.",
    subheadline: "From your daughter's Mehndi to your son's Namkaran — Utsavé gives you invites, RSVPs, photo galleries, and WhatsApp reminders for every celebration in your family's life.",
    ctaText:     "Begin your celebration →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "https://images.pexels.com/photos/33006935/pexels-photo-33006935.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Elegant Sikh wedding ceremony" },
      { src: "https://images.pexels.com/photos/7686304/pexels-photo-7686304.jpeg?auto=compress&cs=tinysrgb&w=800",   alt: "Family celebrating Diwali" },
      { src: "https://images.pexels.com/photos/30672289/pexels-photo-30672289.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Joyful bride at Haldi ceremony" },
    ],
  },
  eventTypeKeys: ["wedding", "birthday", "diwali", "puja", "namkaran", "godh_bharai", "graduation"],
  ctaBanner: {
    headline: "Your next celebration deserves Utsavé.",
    sub:      "Free to start. No credit card required.",
    cta:      "Begin your celebration →",
    href:     "/auth/register",
  },
  intakeMode: "full",
  helpCta: {
    enabled:    true,
    headline:   "Want help planning your celebration?",
    sub:        "Let our team design, plan and execute your event — end to end.",
    email:      "contact@utsav-events.com",
    phone:      "703-628-7023",
    buttonText: "Get Started →",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme: Festival (vibrant marigold orange — Holi, Diwali, Navratri)
// ─────────────────────────────────────────────────────────────────────────────
const FESTIVAL = {
  name: "festival",
  displayName: "Festivals (Holi, Diwali, Navratri)",
  palette: {
    accent:     "#e85d04",
    accentHover:"#c44d03",
    accentDim:  "rgba(232, 93, 4, 0.12)",
    bg:         "#fff8f0",
    accentDeep: "#9b2226",
  },
  hero: {
    badge:       "For every Indian celebration, everywhere",
    headline:    "Light the diyas.\nThrow the colors.\nWe'll handle the rest.",
    subheadline: "Your family spans continents — but your Diwali, Holi, Navratri, or Eid shouldn't feel that way. Beautiful invites, effortless RSVPs, gentle reminders, and a Memories gallery that keeps the celebration alive long after the lights go out.",
    ctaText:     "Want help planning your event?",
    ctaHref:     "/auth/register",
    photos: [
      { src: "https://images.pexels.com/photos/7686304/pexels-photo-7686304.jpeg?auto=compress&cs=tinysrgb&w=800",   alt: "Family celebrating Diwali with sparklers" },
      { src: "https://images.pexels.com/photos/18230345/pexels-photo-18230345.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Friends celebrating Holi with colors" },
      { src: "https://images.pexels.com/photos/17264037/pexels-photo-17264037.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Garba dancers at Navratri" },
    ],
  },
  eventTypeKeys: ["diwali", "holi", "navratri", "puja", "birthday", "wedding", "graduation"],
  ctaBanner: {
    headline: "This festival season, bring everyone together.",
    sub:      "Free to start. No WhatsApp chaos required.",
    cta:      "Start for free →",
    href:     "/auth/register",
  },
  intakeMode: "light",
  helpCta: {
    enabled:    true,
    headline:   "Want help planning your event?",
    sub:        "Let our team handle the invites, décor, and day-of coordination.",
    email:      "contact@utsav-events.com",
    phone:      "703-628-7023",
    buttonText: "Get Started →",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme: Puja (saffron/maroon — religious & ceremony events)
// ─────────────────────────────────────────────────────────────────────────────
const PUJA = {
  name: "puja",
  displayName: "Religious / Puja Events",
  palette: {
    accent:     "#b5451b",
    accentHover:"#943915",
    accentDim:  "rgba(181, 69, 27, 0.12)",
    bg:         "#fdf6ed",
    accentDeep: "#7c3238",
  },
  hero: {
    badge:       "Sacred ceremonies, beautifully organised",
    headline:    "Light the diya.\nFold your hands.\nWe'll handle the rest.",
    subheadline: "From Satyanarayan to Griha Pravesh, Shivratri to Janmashtami — invite your family, collect RSVPs, and share the memories, all from one platform.",
    ctaText:     "Organise your ceremony →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "https://images.pexels.com/photos/7685983/pexels-photo-7685983.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Mother and daughter at Puja ceremony" },
      { src: "https://images.pexels.com/photos/7686327/pexels-photo-7686327.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Indian family gathering" },
      { src: "https://images.pexels.com/photos/7686304/pexels-photo-7686304.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Diwali celebration" },
    ],
  },
  eventTypeKeys: ["puja", "wedding", "namkaran", "godh_bharai", "diwali", "graduation", "birthday"],
  ctaBanner: {
    headline: "Organise your next puja or ceremony with ease.",
    sub:      "Your family deserves a seamless experience.",
    cta:      "Get started free →",
    href:     "/auth/register",
  },
  intakeMode: "light",
  helpCta: {
    enabled:    true,
    headline:   "Want help organising your puja or ceremony?",
    sub:        "Let our team handle the coordination so you can focus on the blessings.",
    email:      "contact@utsav-events.com",
    phone:      "703-628-7023",
    buttonText: "Get Started →",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme: Anniversary (amethyst/royal purple — 25th, 50th milestones)
// ─────────────────────────────────────────────────────────────────────────────
const ANNIVERSARY = {
  name: "anniversary",
  displayName: "Marriage Anniversary (25th / 50th)",
  palette: {
    accent:     "#9d6b9e",
    accentHover:"#7e5580",
    accentDim:  "rgba(157, 107, 158, 0.12)",
    bg:         "#faf7fc",
    accentDeep: "#5b3b8c",
  },
  hero: {
    badge:       "Celebrate a lifetime of love",
    headline:    "A lifetime of love.\nNow celebrate it.\nWe'll handle the rest.",
    subheadline: "Make your Silver or Golden anniversary a celebration the whole family will remember — with beautiful invite pages, RSVPs, photo galleries, and WhatsApp reminders.",
    ctaText:     "Plan the celebration →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "https://images.pexels.com/photos/15662086/pexels-photo-15662086.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Couple celebrating their anniversary" },
      { src: "https://images.pexels.com/photos/33006935/pexels-photo-33006935.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Wedding ceremony" },
      { src: "https://images.pexels.com/photos/8819763/pexels-photo-8819763.jpeg?auto=compress&cs=tinysrgb&w=800",   alt: "Family celebration" },
    ],
  },
  eventTypeKeys: ["anniversary", "wedding", "birthday", "puja", "namkaran", "godh_bharai", "graduation"],
  ctaBanner: {
    headline: "A milestone this special deserves the perfect celebration.",
    sub:      "Plan it once. Cherish it forever.",
    cta:      "Start planning →",
    href:     "/auth/register",
  },
  intakeMode: "full",
  helpCta: {
    enabled:    true,
    headline:   "Want help planning your anniversary celebration?",
    sub:        "Let our team design and execute a celebration as grand as your love story.",
    email:      "contact@utsav-events.com",
    phone:      "703-628-7023",
    buttonText: "Get Started →",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme: Birthday Kid (sky blue / golden yellow — 1st birthday)
// ─────────────────────────────────────────────────────────────────────────────
const BIRTHDAY_KID = {
  name: "birthday_kid",
  displayName: "Kid's Birthday (1st Birthday)",
  palette: {
    accent:     "#2d9cdb",
    accentHover:"#2180b6",
    accentDim:  "rgba(45, 156, 219, 0.12)",
    bg:         "#f0f8ff",
    accentDeep: "#e0a318",
  },
  hero: {
    badge:       "Because every first deserves a party",
    headline:    "One tiny human.\nOne big celebration.\nWe'll handle the rest.",
    subheadline: "Plan your little one's first birthday with family from across the world — beautiful invite pages, RSVPs, photo galleries, and WhatsApp reminders in one joyful platform.",
    ctaText:     "Plan the birthday party →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "https://images.pexels.com/photos/13321666/pexels-photo-13321666.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Baby's first birthday party" },
      { src: "https://images.pexels.com/photos/7686327/pexels-photo-7686327.jpeg?auto=compress&cs=tinysrgb&w=800",   alt: "Indian family gathering" },
      { src: "https://images.pexels.com/photos/19962115/pexels-photo-19962115.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Birthday celebration" },
    ],
  },
  eventTypeKeys: ["birthday", "namkaran", "godh_bharai", "puja", "wedding", "graduation", "diwali"],
  ctaBanner: {
    headline: "This first birthday only happens once — make it magical.",
    sub:      "Free to start. No credit card required.",
    cta:      "Start planning →",
    href:     "/auth/register",
  },
  intakeMode: "light",
  helpCta: {
    enabled:    true,
    headline:   "Want help planning their big day?",
    sub:        "Let our team take care of every detail so you can be fully present.",
    email:      "contact@utsav-events.com",
    phone:      "703-628-7023",
    buttonText: "Get Started →",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Theme: Birthday Adult (navy / gold — 40th, 50th milestone birthdays)
// ─────────────────────────────────────────────────────────────────────────────
const BIRTHDAY_ADULT = {
  name: "birthday_adult",
  displayName: "Adult Milestone Birthday (50th)",
  palette: {
    accent:     "#1b4f72",
    accentHover:"#154060",
    accentDim:  "rgba(27, 79, 114, 0.12)",
    bg:         "#f5f5f0",
    accentDeep: "#c9941a",
  },
  hero: {
    badge:       "Fifty is fabulous",
    headline:    "Fifty is fabulous.\nMake it legendary.\nWe'll handle the rest.",
    subheadline: "Plan a 40th, 50th, or any milestone birthday with the elegance it deserves — invites, RSVPs, private photo galleries, and WhatsApp reminders for all the family.",
    ctaText:     "Plan the birthday →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "https://images.pexels.com/photos/30218081/pexels-photo-30218081.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "50th birthday party celebration" },
      { src: "https://images.pexels.com/photos/8819763/pexels-photo-8819763.jpeg?auto=compress&cs=tinysrgb&w=800",   alt: "Family celebration" },
      { src: "https://images.pexels.com/photos/33006935/pexels-photo-33006935.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Elegant celebration" },
    ],
  },
  eventTypeKeys: ["birthday", "anniversary", "wedding", "puja", "graduation", "diwali", "namkaran"],
  ctaBanner: {
    headline: "This milestone deserves a celebration as grand as their story.",
    sub:      "Start planning in minutes. Free to try.",
    cta:      "Plan the celebration →",
    href:     "/auth/register",
  },
  intakeMode: "light",
  helpCta: {
    enabled:    true,
    headline:   "Want help planning this milestone birthday?",
    sub:        "Let our team design and execute the celebration they deserve.",
    email:      "contact@utsav-events.com",
    phone:      "703-628-7023",
    buttonText: "Get Started →",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_THEMES = {
  wedding:       WEDDING,
  festival:      FESTIVAL,
  puja:          PUJA,
  anniversary:   ANNIVERSARY,
  birthday_kid:  BIRTHDAY_KID,
  birthday_adult: BIRTHDAY_ADULT,
};
