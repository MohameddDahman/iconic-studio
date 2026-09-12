import { img } from "./media";
import type { Media } from "./types";

/**
 * What the studio does, in one place — the home page, /services and the footer
 * all read from here so they can never drift apart.
 *
 * Server-side only in practice: it resolves images through the media manifest,
 * so pass the data down to client components as props rather than importing
 * this file into them.
 */

export interface Discipline {
  id: string;
  n: string;
  name: string;
  /** One line for lists. */
  line: string;
  body: string;
  includes: string[];
  media: Media;
}

export const DISCIPLINES: Discipline[] = [
  {
    id: "residential",
    n: "01",
    name: "Residential interiors",
    line: "Apartments, villas, duplexes and penthouses.",
    body: "Whole homes, planned around how you actually live in them — layouts, ceilings, lighting, joinery and every finish, through to the last cushion.",
    includes: ["Space planning", "Ceilings & lighting", "Joinery & wardrobes", "Furniture & styling"],
    media: img("client/boho-living-day.jpg", "A family living room with a timber-panelled wall and a bouclé armchair"),
  },
  {
    id: "workplaces",
    n: "02",
    name: "Workplaces",
    line: "Offices, headquarters and showrooms.",
    body: "Offices that clients remember and teams want to come back to — reception, meeting rooms, open floors and executive suites, with acoustics and services designed in rather than added on.",
    includes: ["Reception & brand walls", "Meeting & focus rooms", "Acoustic design", "Fit-out management"],
    media: img("stock/office-03.jpg", "An executive office with a sculptural desk and curved lounge chairs"),
  },
  {
    id: "hospitality",
    n: "03",
    name: "Hospitality",
    line: "Restaurants, cafés, lounges and hotels.",
    body: "Rooms that are judged at night and still have to work at noon — lighting scenes, seating plans, bars and back-of-house flow, designed together.",
    includes: ["Concept & identity", "Lighting scenes", "Bars & counters", "Custom furniture"],
    media: img("stock/hospitality-07.jpg", "A dark lounge bar with a timber counter and a round bronze mirror"),
  },
  {
    id: "retail-clinics",
    n: "04",
    name: "Retail & clinics",
    line: "Boutiques, showrooms, clinics and spas.",
    body: "Spaces that have to sell or to reassure: display joinery that lights the product from inside, and clinic interiors that feel calm while meeting every hygiene requirement.",
    includes: ["Display joinery", "Customer journey", "Clinical finishes", "Wayfinding"],
    media: img("stock/retail-14.jpg", "A boutique lined with sculptural timber shelving"),
  },
  {
    id: "kitchens-bathrooms",
    n: "05",
    name: "Kitchens & bathrooms",
    line: "The rooms with the most joints per square metre.",
    body: "Stone set out before a single fitting is chosen, kitchens drawn to the centimetre, and brassware specified to suit — the rooms where detail shows first.",
    includes: ["Stone setting-out", "Kitchen design", "Vanities & showers", "Brassware selection"],
    media: img("client/marble-bath-01.jpg", "A walk-in shower and vanity wrapped in veined onyx with a walnut screen"),
  },
  {
    id: "lighting",
    n: "06",
    name: "Lighting & ceilings",
    line: "Gypsum coves, hidden profiles and statement pendants.",
    body: "Most of our rooms are lit from their edges. The ceiling and the lighting layout are designed together, so every light has a reason to be there — and the room works in daylight and after dark.",
    includes: ["Gypsum ceilings & coves", "Lighting layouts", "Decorative pendants", "Scenes & dimming"],
    media: img("client/guest-bath-mirror-night.jpg", "Porcelain petal pendants glowing beside a backlit mirror after dark"),
  },
  {
    id: "decor",
    n: "07",
    name: "Decor & styling",
    line: "Furniture, fabrics, curtains, art and objects.",
    body: "The layer that makes a room feel finished — furniture selected or made to measure, curtains and upholstery, rugs, art and the objects on the shelves.",
    includes: ["Furniture sourcing", "Curtains & upholstery", "Art & accessories", "Final styling"],
    media: img("stock/detail-34.jpg", "Dried flowers in a ceramic vase with late light across the wall"),
  },
  {
    id: "execution",
    n: "08",
    name: "Turnkey execution",
    line: "One team from the empty shell to handover.",
    body: "Our own site team builds what we draw: gypsum, joinery, marble, electrics, paint and installation — scheduled, supervised and snagged by the people who designed it.",
    includes: ["Site supervision", "Gypsum & joinery works", "Marble & tiling", "Snagging & handover"],
    media: img("stock/drafting-05.jpg", "Construction drawings laid out with pens and a scale ruler"),
  },
];

/**
 * Work stages are a genuine sequence — you cannot detail a room you have not
 * agreed a layout for — so numbering them carries information.
 */
export const STAGES = [
  {
    n: "01",
    name: "Brief & survey",
    note: "We visit, measure and listen: how you live or work in the space, what the shell allows, and the budget it has to respect.",
  },
  {
    n: "02",
    name: "Concept & moodboard",
    note: "Layout options, a material and colour direction, and the lighting idea — the three decisions everything else follows.",
  },
  {
    n: "03",
    name: "3D visualisation",
    note: "Photoreal renders of every key room, by daylight and after dark, so you see the finished space before anything is ordered.",
  },
  {
    n: "04",
    name: "Technical drawings",
    note: "Plans, ceiling and lighting layouts, elevations and joinery details — complete enough to price once and build right.",
  },
  {
    n: "05",
    name: "Selection & procurement",
    note: "Stone, timber, fabrics and fittings, chosen with samples in the room they are going into.",
  },
  {
    n: "06",
    name: "Execution & handover",
    note: "Our site team builds, supervises and snags. You receive a finished, cleaned and styled space.",
  },
] as const;
