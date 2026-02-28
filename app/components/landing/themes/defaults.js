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
    photo: "/assets/celebrations/photos/wedding/pexels-33006935.jpg",
    photoAlt: "Elegant Sikh wedding ceremony",
  },
  birthday: {
    icon: "🎂",
    name: "Birthday Bash",
    detail: "Milestone birthdays & 1st celebrations",
    photo: "/assets/celebrations/photos/birthday/pexels-19962115.jpg",
    photoAlt: "Indian birthday celebration",
  },
  diwali: {
    icon: "🪔",
    name: "Diwali Party",
    detail: "Festival gatherings with your community",
    photo: "/assets/celebrations/photos/diwali/pexels-7686304.jpg",
    photoAlt: "Family celebrating Diwali with sparklers",
  },
  puja: {
    icon: "🙏",
    name: "Puja & Ceremony",
    detail: "Satyanarayan, Griha Pravesh & more",
    photo: "/assets/celebrations/photos/puja/pexels-7685983.jpg",
    photoAlt: "Mother and daughter performing puja ritual",
  },
  namkaran: {
    icon: "👶",
    name: "Namkaran",
    detail: "Welcome your little one with family",
    photo: "/assets/celebrations/photos/family/pexels-7686327.jpg",
    photoAlt: "Indian family gathering for ceremony",
  },
  godh_bharai: {
    icon: "🌸",
    name: "Godh Bharai",
    detail: "Baby showers, the desi way",
    photo: "/assets/celebrations/photos/family/pexels-8819763.jpg",
    photoAlt: "Family celebration with gifts in traditional attire",
  },
  graduation: {
    icon: "🎓",
    name: "Graduation",
    detail: "Celebrate the milestone with everyone",
    photo: "/assets/celebrations/photos/family/pexels-35077186.jpg",
    photoAlt: "Family birthday celebration outdoors",
  },
  holi: {
    icon: "🎨",
    name: "Holi Celebration",
    detail: "Colors, music & community joy",
    photo: "/assets/celebrations/photos/holi/pexels-18230345.jpg",
    photoAlt: "Friends celebrating Holi with colors",
  },
  navratri: {
    icon: "💃",
    name: "Navratri / Garba",
    detail: "Garba & dandiya nights",
    photo: "/assets/celebrations/photos/navratri/pexels-17264037.jpg",
    photoAlt: "Garba dancers in traditional dress",
  },
  anniversary: {
    icon: "💑",
    name: "Anniversary",
    detail: "Silver, golden & ruby milestones",
    photo: "/assets/celebrations/photos/anniversary_25/pexels-15662086.jpg",
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
    headline:    "Every function.\nEvery memory.\nOne place.",
    subheadline: "From your daughter's Mehndi to your son's Namkaran — Utsavé gives you invites, RSVPs, photo galleries, and WhatsApp reminders for every celebration in your family's life.",
    ctaText:     "Begin your celebration →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "/assets/celebrations/photos/wedding/pexels-33006935.jpg", alt: "Elegant Sikh wedding ceremony" },
      { src: "/assets/celebrations/photos/diwali/pexels-7686304.jpg",   alt: "Family celebrating Diwali" },
      { src: "/assets/celebrations/photos/haldi/pexels-30672289.jpg",   alt: "Joyful bride at Haldi ceremony" },
    ],
  },
  eventTypeKeys: ["wedding", "birthday", "diwali", "puja", "namkaran", "godh_bharai", "graduation"],
  ctaBanner: {
    headline: "Your next celebration deserves Utsavé.",
    sub:      "Free to start. No credit card required.",
    cta:      "Begin your celebration →",
    href:     "/auth/register",
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
    badge:       "Festival season is here",
    headline:    "Every festival.\nEvery color.\nOne platform.",
    subheadline: "Plan your Diwali puja, Holi bash, Navratri garba, or Eid dinner — with invites, RSVPs, and WhatsApp messaging your community will love.",
    ctaText:     "Start planning your festival →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "/assets/celebrations/photos/diwali/pexels-7686304.jpg",   alt: "Family celebrating Diwali with sparklers" },
      { src: "/assets/celebrations/photos/holi/pexels-18230345.jpg",     alt: "Friends celebrating Holi with colors" },
      { src: "/assets/celebrations/photos/navratri/pexels-17264037.jpg", alt: "Garba dancers at Navratri" },
    ],
  },
  eventTypeKeys: ["diwali", "holi", "navratri", "puja", "birthday", "wedding", "graduation"],
  ctaBanner: {
    headline: "Make this festival season unforgettable.",
    sub:      "Invites, RSVPs, WhatsApp blasts — all in one place.",
    cta:      "Start for free →",
    href:     "/auth/register",
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
    headline:    "Every puja.\nEvery blessing.\nPerfectly planned.",
    subheadline: "From Satyanarayan to Griha Pravesh, Shivratri to Janmashtami — invite your family, collect RSVPs, and share the memories, all from one platform.",
    ctaText:     "Organise your ceremony →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "/assets/celebrations/photos/puja/pexels-7685983.jpg",    alt: "Mother and daughter at Puja ceremony" },
      { src: "/assets/celebrations/photos/family/pexels-7686327.jpg",  alt: "Indian family gathering" },
      { src: "/assets/celebrations/photos/diwali/pexels-7686304.jpg",  alt: "Diwali celebration" },
    ],
  },
  eventTypeKeys: ["puja", "wedding", "namkaran", "godh_bharai", "diwali", "graduation", "birthday"],
  ctaBanner: {
    headline: "Organise your next puja or ceremony with ease.",
    sub:      "Your family deserves a seamless experience.",
    cta:      "Get started free →",
    href:     "/auth/register",
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
    headline:    "25 years.\n50 years.\nEvery memory preserved.",
    subheadline: "Make your Silver or Golden anniversary a celebration the whole family will remember — with beautiful invite pages, RSVPs, photo galleries, and WhatsApp reminders.",
    ctaText:     "Plan the celebration →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "/assets/celebrations/photos/anniversary_25/pexels-15662086.jpg", alt: "Couple celebrating their anniversary" },
      { src: "/assets/celebrations/photos/wedding/pexels-33006935.jpg", alt: "Wedding ceremony" },
      { src: "/assets/celebrations/photos/family/pexels-8819763.jpg",   alt: "Family celebration" },
    ],
  },
  eventTypeKeys: ["anniversary", "wedding", "birthday", "puja", "namkaran", "godh_bharai", "graduation"],
  ctaBanner: {
    headline: "A milestone this special deserves the perfect celebration.",
    sub:      "Plan it once. Cherish it forever.",
    cta:      "Start planning →",
    href:     "/auth/register",
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
    headline:    "Their 1st birthday.\nYour biggest\ncelebration.",
    subheadline: "Plan your little one's first birthday with family from across the world — beautiful invite pages, RSVPs, photo galleries, and WhatsApp reminders in one joyful platform.",
    ctaText:     "Plan the birthday party →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "/assets/celebrations/photos/birthday_1st/pexels-13321666.jpg", alt: "Baby's first birthday party" },
      { src: "/assets/celebrations/photos/family/pexels-7686327.jpg",  alt: "Indian family gathering" },
      { src: "/assets/celebrations/photos/birthday/pexels-19962115.jpg", alt: "Birthday celebration" },
    ],
  },
  eventTypeKeys: ["birthday", "namkaran", "godh_bharai", "puja", "wedding", "graduation", "diwali"],
  ctaBanner: {
    headline: "This first birthday only happens once — make it magical.",
    sub:      "Free to start. No credit card required.",
    cta:      "Start planning →",
    href:     "/auth/register",
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
    headline:    "A milestone birthday\ndeserves a\ngrand celebration.",
    subheadline: "Plan a 40th, 50th, or any milestone birthday with the elegance it deserves — invites, RSVPs, private photo galleries, and WhatsApp reminders for all the family.",
    ctaText:     "Plan the birthday →",
    ctaHref:     "/auth/register",
    photos: [
      { src: "/assets/celebrations/photos/birthday_50th/pexels-30218081.jpg", alt: "50th birthday party celebration" },
      { src: "/assets/celebrations/photos/family/pexels-8819763.jpg",  alt: "Family celebration" },
      { src: "/assets/celebrations/photos/wedding/pexels-33006935.jpg",alt: "Elegant celebration" },
    ],
  },
  eventTypeKeys: ["birthday", "anniversary", "wedding", "puja", "graduation", "diwali", "namkaran"],
  ctaBanner: {
    headline: "This milestone deserves a celebration as grand as their story.",
    sub:      "Start planning in minutes. Free to try.",
    cta:      "Plan the celebration →",
    href:     "/auth/register",
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
