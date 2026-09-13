import { img } from "./media";
import type { Project, Spread, StudioSettings, Testimonial, Threshold } from "./types";

/* ---------------------------------------------------------------------------
 * SEED CONTENT
 *
 * Two kinds of imagery, and they must not be confused before launch:
 *
 * - /media/client/…  The studio's own renders, cut from the posts the client
 *   supplied. Real work. Two of them exist as daylight/evening pairs.
 * - /media/stock/…   Licensed Unsplash photography (see media-credits.json),
 *   used to show the range of project types the studio takes on. Every project
 *   built from it is marked `placeholder: true` and must be replaced with real
 *   work — or removed — before the site goes public.
 *
 * Titles, areas and locations of placeholder projects are working copy.
 * Once a collection has rows in Convex, the seed set stops being used for it.
 * ------------------------------------------------------------------------ */

export const SEED_SETTINGS: StudioSettings = {
  name: "Iconic",
  tagline: "Interiors, decor & execution",
  intro:
    "Iconic is an interior design and execution studio. We design homes, workplaces, restaurants, hotels and clinics — then build them with our own site team, so the finished room is the room that was drawn.",
  email: "",
  phone: "+20 155 913 0844",
  whatsapp: "+20 155 913 0844",
  address: [
    "Iconic Architecture Design",
    "Baron Building, 669 El Horreya Road",
    "Gianaclis, Abu Qir — next to the church",
    "Alexandria 21523, Egypt",
  ],
  instagram: "iconic_architecture_design",
  instagramUrl: "https://www.instagram.com/iconic_architecture_design",
  mapUrl: "https://maps.app.goo.gl/812AAohLGn5jcmRP8",
  links: [
    { label: "Facebook", url: "https://www.facebook.com/Iconic-architecture-design-320706782024246" },
    { label: "Behance", url: "https://www.behance.net/iconic_arcb479" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/iconic-architecture-design-990322403" },
    { label: "Review us on Google", url: "https://g.page/r/CfWrGa57-KN0EBM/review" },
  ],
};

export const SEED_PROJECTS: Project[] = [
  {
    slug: "villa-obsidian",
    title: "Villa Obsidian",
    reference: "IC-25-031",
    year: 2025,
    location: "New Cairo",
    typology: "Villa",
    stage: "Built",
    brief: "A family villa finished almost entirely in dark timber, stone and shadow.",
    statement: [
      "The brief was a house that feels calm at eleven at night, not only at noon. So the palette was chosen by lamplight first: smoked oak, Nero Marquina, bronze and a charcoal plaster that turns warm the moment a cove light touches it.",
      "Light is built into the joinery rather than hung from the ceiling. Slatted walls are backlit from a recessed channel, the kitchen island glows from its plinth, and the bathrooms are lit by their mirrors. The ceiling stays almost empty.",
      "Every room shares the same three materials, so the house reads as one continuous interior as you move through it rather than a sequence of decorated rooms.",
    ],
    materials: ["Smoked oak slats", "Nero Marquina marble", "Charcoal lime plaster", "Bronze metalwork", "Bouclé upholstery"],
    facts: [
      { label: "Area", value: "640 m²" },
      { label: "Scope", value: "Design & execution" },
      { label: "Rooms", value: "14" },
      { label: "Sector", value: "Residential" },
    ],
    cover: img("stock/moody-01.jpg", "A dark sofa in front of a backlit wall of vertical timber slats"),
    gallery: [
      img("stock/living-08.jpg", "A long timber-lined living room with a linear fireplace and a sculptural brass wall piece", "Living room"),
      img("stock/moody-09.jpg", "A dark dining room with a marble wall, slatted panelling and a linear pendant", "Dining"),
      img("stock/kitchen-14.jpg", "A black kitchen with a Nero Marquina island lit from beneath its cabinets", "Kitchen"),
      img("stock/bath-05.jpg", "A black marble bathroom with a backlit mirror over a floating vanity", "Master bath"),
      img("stock/bedroom-12.jpg", "A dark bedroom with a round mirror, bedside pendants and heavy curtains", "Master bedroom"),
    ],
    featured: true,
    order: 1,
    placeholder: true,
  },
  {
    slug: "modern-boho-residence",
    title: "Modern Boho Residence",
    reference: "IC-25-012",
    year: 2025,
    location: "Alexandria",
    typology: "Apartment",
    stage: "Design stage",
    brief: "A family apartment in timber, bouclé and terrazzo — designed for daylight and for evening.",
    statement: [
      "The family room is built around one long wall of vertical timber panels that hides the television, the storage and the services behind it. Everything soft in the room — the bouclé armchair, the patterned cushions, the low round table — sits in front of it.",
      "It was rendered twice on purpose. By day the room is carried by the window and the pale floor; after dark it is lit only from the cove and a few low sources, and the timber takes over. Use the lamp switch on the image to see both.",
      "The guest bathroom picks up the same warmth in terrazzo: a speckled vanity and splashback, an arched backlit mirror, and a woven pendant hung low over the basin.",
    ],
    materials: ["Vertical oak panelling", "Terrazzo", "Bouclé", "Linen curtains", "Brushed bronze"],
    facts: [
      { label: "Rooms", value: "Living & guest bath" },
      { label: "Scope", value: "Interior design" },
      { label: "Stage", value: "Visualised" },
      { label: "Sector", value: "Residential" },
    ],
    cover: img(
      "client/boho-living-day.jpg",
      "A family living room with a timber-panelled television wall, a bouclé armchair and a low round coffee table under a lit cove",
      undefined,
      { night: "client/boho-living-night.jpg" },
    ),
    gallery: [
      img("client/terrazzo-bath-mirror.jpg", "An arched mirror framed in terrazzo and backlit against a sage wall", "Guest bath — the mirror"),
      img("client/terrazzo-bath-01.jpg", "A terrazzo vanity and splashback under a woven pendant, with a high window above", "Guest bath"),
    ],
    featured: true,
    order: 2,
  },
  {
    slug: "atelier-headquarters",
    title: "Atelier Headquarters",
    reference: "IC-24-044",
    year: 2024,
    location: "Fifth Settlement, New Cairo",
    typology: "Office",
    stage: "Built",
    brief: "Three floors of offices that feel closer to a members' club than a workplace.",
    statement: [
      "A consultancy that meets clients in its own building needed rooms that do the selling. The reception is a single slab of stone against a slatted timber wall; the executive floor trades corridors for lounges.",
      "Open-plan areas are divided by glass and shelving rather than partitions, so daylight reaches the middle of the plan, and acoustic panels are hidden behind the timber so the floors stay quiet without looking like an office.",
    ],
    materials: ["Oak veneer slats", "Honed limestone", "Acoustic felt", "Smoked glass", "Blackened steel"],
    facts: [
      { label: "Area", value: "1,850 m²" },
      { label: "Scope", value: "Design & fit-out" },
      { label: "Floors", value: "3" },
      { label: "Sector", value: "Commercial" },
    ],
    cover: img("stock/office-03.jpg", "An executive office with a sculptural desk and two curved lounge chairs"),
    gallery: [
      img("stock/office-24.jpg", "A stone reception desk set against a wall of timber slats", "Reception"),
      img("stock/office-01.jpg", "An open-plan office with timber shelving, glass partitions and linear lighting", "Studio floor"),
      img("stock/office-11.jpg", "A lounge on the executive floor with warm timber walls and low seating", "Executive lounge"),
      img("stock/office-09.jpg", "A private office with a marble desk under a ring pendant", "Private office"),
    ],
    featured: true,
    order: 3,
    placeholder: true,
  },
  {
    slug: "maison-noir",
    title: "Maison Noir",
    reference: "IC-24-038",
    year: 2024,
    location: "Zamalek, Cairo",
    typology: "Hospitality",
    stage: "Built",
    brief: "A restaurant and lounge lit like a private house after dark.",
    statement: [
      "Restaurants are judged at night, so the lighting was designed before the furniture. There is no general light in the dining room at all: every table has its own pool, the bar glows from beneath, and the walls are washed from the floor.",
      "The palette is deliberately short — dark timber, oxblood upholstery, aged brass — so the food, the people and the light are the only things that change through the evening.",
    ],
    materials: ["Stained walnut", "Oxblood velvet", "Aged brass", "Terrazzo bar front", "Smoked mirror"],
    facts: [
      { label: "Covers", value: "120" },
      { label: "Scope", value: "Design & execution" },
      { label: "Area", value: "410 m²" },
      { label: "Sector", value: "Hospitality" },
    ],
    cover: img("stock/hospitality-07.jpg", "A dark lounge bar with a timber-clad counter and a round bronze mirror"),
    gallery: [
      img("stock/hospitality-06.jpg", "Clusters of copper pendant lights over deep red booths", "Dining room"),
      img("stock/hospitality-01.jpg", "A dim restaurant behind a carved timber screen, looking out to a garden", "Garden room"),
      img("stock/hospitality-21.jpg", "A long banquette against vertical timber panelling", "Banquette"),
      img("stock/hospitality-08.jpg", "A bar with warm pendant lights and low lounge chairs", "Bar"),
    ],
    featured: true,
    order: 4,
    placeholder: true,
  },
  {
    slug: "serein-penthouse",
    title: "Serein Penthouse",
    reference: "IC-25-006",
    year: 2025,
    location: "Sheikh Zayed",
    typology: "Penthouse",
    stage: "Built",
    brief: "A top-floor apartment arranged around the view and the hour it looks best.",
    statement: [
      "The penthouse faces west, so the whole plan was organised around sunset: the living room runs the length of the glazing, and the cove lighting is set to take over exactly as the daylight fades.",
      "Curves soften a plan that is otherwise all straight glass — a bouclé sofa that follows the slatted wall, an arched headboard in the master bedroom, round mirrors in every bathroom.",
    ],
    materials: ["Bouclé", "Travertine", "Fluted oak", "Warm white lime plaster", "Champagne brass"],
    facts: [
      { label: "Area", value: "380 m²" },
      { label: "Scope", value: "Design, decor & execution" },
      { label: "Bedrooms", value: "4" },
      { label: "Sector", value: "Residential" },
    ],
    cover: img("stock/living-17.jpg", "A living room at dusk with floor-to-ceiling windows and a lit cove ceiling"),
    gallery: [
      img("stock/living-13.jpg", "A curved bouclé sofa in front of timber slats with brass side tables", "Living room"),
      img("stock/dining-11.jpg", "A dining room with a sculptural pendant over a marble-topped table", "Dining"),
      img("stock/bedroom-09.jpg", "A bedroom with an arched, backlit headboard wall", "Master bedroom"),
      img("stock/bath-26.jpg", "A bathroom in dark marble and timber with a round backlit mirror", "Master bath"),
      img("stock/detail-34.jpg", "Dried flowers in a ceramic vase with late light across the wall", "Styling"),
    ],
    featured: true,
    order: 5,
    placeholder: true,
  },
  {
    slug: "the-grand-reception",
    title: "The Grand Reception",
    reference: "IC-24-027",
    year: 2024,
    location: "New Administrative Capital",
    typology: "Hospitality",
    stage: "Built",
    brief: "A hotel lobby shaped as one sweeping curve of timber, water and stone.",
    statement: [
      "Guests arrive from a bright forecourt, so the lobby had to change pace immediately. A curved timber wall draws them past a still-water feature towards the desk, and the ceiling drops over the lounge so it feels like a room rather than a hall.",
      "Every surface a hand touches is warm — leather, timber, brushed brass — while the floor and the desk are stone, so the space wears well under thousands of arrivals a week.",
    ],
    materials: ["Curved walnut cladding", "Crema Marfil", "Brushed brass", "Cognac leather", "Wool carpet"],
    facts: [
      { label: "Area", value: "1,200 m²" },
      { label: "Scope", value: "Interior design" },
      { label: "Keys", value: "240" },
      { label: "Sector", value: "Hospitality" },
    ],
    cover: img("stock/lobby-09.jpg", "A hotel lobby wrapped in curved timber, with a water feature and stone floor"),
    gallery: [
      img("stock/lobby-13.jpg", "A double-height lobby with a pool, marble floor and a round chandelier", "Atrium"),
      img("stock/lobby-00.jpg", "A reception desk in black marble with brass edging", "Reception desk"),
      img("stock/lobby-11.jpg", "A curved lounge with cognac armchairs on a red rug", "Lounge"),
      img("stock/entrance-16.jpg", "A marble entrance with gilded screens and a low seating group", "Entrance"),
    ],
    featured: true,
    order: 6,
    placeholder: true,
  },
  {
    slug: "warm-minimal-guest-bath",
    title: "Warm Minimal Guest Bath",
    reference: "IC-25-019",
    year: 2025,
    location: "Cairo",
    typology: "Apartment",
    stage: "Design stage",
    brief: "A small bathroom with one glass basin, one backlit mirror and a pendant like a flower.",
    statement: [
      "Small rooms need one strong idea rather than many small ones. Here it is the light: an arched mirror lit from behind, and a porcelain pendant shaped like petals hung low beside it.",
      "The room was rendered by day and after dark. In the evening render every other light is off, and the room is carried entirely by the mirror and the pendant — flip the lamp switch on the image to compare.",
    ],
    materials: ["Fluted timber panel", "Ribbed glass basin", "Leathered granite", "Porcelain pendant", "Brushed nickel"],
    facts: [
      { label: "Room", value: "Guest bath" },
      { label: "Scope", value: "Interior design" },
      { label: "Stage", value: "Visualised" },
      { label: "Sector", value: "Residential" },
    ],
    cover: img(
      "client/guest-bath-mirror-day.jpg",
      "A ribbed glass basin beneath a backlit arched mirror, with porcelain petal pendants",
      undefined,
      { night: "client/guest-bath-mirror-night.jpg" },
    ),
    gallery: [
      img("client/guest-bath-wide.jpg", "The guest bathroom: stone feature wall, backlit arched mirror and a floating vanity", "The whole room"),
      img("client/guest-bath-door.jpg", "The flush door and pendant seen from the vanity", "Looking back"),
    ],
    featured: false,
    order: 7,
  },
  {
    slug: "serenity-clinic-and-spa",
    title: "Serenity Clinic & Spa",
    reference: "IC-24-052",
    year: 2024,
    location: "Sheikh Zayed",
    typology: "Healthcare",
    stage: "Built",
    brief: "A clinic that does not feel like one, and a spa beneath it.",
    statement: [
      "Patients wait upstairs in daylight: white plaster, an indoor olive tree and a reception counter with no visible hardware. Treatment rooms are quieter and warmer, and the spa level drops into timber and water.",
      "Healthcare interiors fail when they look clinical or when they are hard to clean. Every finish here was chosen to do both jobs — seamless resin floors, solid-surface counters and timber sealed for wet rooms.",
    ],
    materials: ["Seamless resin floor", "Solid surface", "Thermally treated timber", "Lime plaster", "Natural stone"],
    facts: [
      { label: "Area", value: "900 m²" },
      { label: "Scope", value: "Design & fit-out" },
      { label: "Treatment rooms", value: "11" },
      { label: "Sector", value: "Healthcare" },
    ],
    cover: img("stock/wellness-12.jpg", "An indoor spa pool lined in timber with loungers and warm linear light"),
    gallery: [
      img("stock/wellness-21.jpg", "A bright clinic reception with a white counter and an indoor olive tree", "Clinic reception"),
      img("stock/wellness-00.jpg", "A spa treatment suite with brown bouclé armchairs", "Treatment suite"),
      img("stock/wellness-14.jpg", "A timber sauna with a stone heater and indirect lighting", "Sauna"),
    ],
    featured: false,
    order: 8,
    placeholder: true,
  },
  {
    slug: "aurum-boutique",
    title: "Aurum Boutique",
    reference: "IC-24-049",
    year: 2024,
    location: "New Cairo",
    typology: "Retail",
    stage: "Built",
    brief: "A fashion boutique where the shelving is the architecture.",
    statement: [
      "With a small range to show, the store needed presence more than capacity. The shelving was designed as one continuous timber structure that rises from the floor, curves over the aisle and becomes the ceiling.",
      "Lighting is integrated into every shelf so the product is lit from inside the joinery, and the fitting rooms are finished like a private dressing room rather than a cubicle.",
    ],
    materials: ["CNC-cut oak ribs", "Micro-cement", "Brushed brass rails", "Suede", "Plaster niches"],
    facts: [
      { label: "Area", value: "160 m²" },
      { label: "Scope", value: "Design & joinery" },
      { label: "Programme", value: "10 weeks" },
      { label: "Sector", value: "Retail" },
    ],
    cover: img("stock/retail-14.jpg", "A boutique lined with sculptural timber shelving that curves over the floor"),
    gallery: [
      img("stock/retail-13.jpg", "Rounded display niches cut into a pale plaster wall", "Display niches"),
      img("stock/retail-15.jpg", "Warm timber shelving with lit niches and a leather bench", "Men's wall"),
      img("stock/retail-10.jpg", "A minimal corner with a paper globe lamp and a low plinth", "Fitting lounge"),
    ],
    featured: false,
    order: 9,
    placeholder: true,
  },
  {
    slug: "stone-bathrooms",
    title: "Stone Bathrooms",
    reference: "IC-25-003",
    year: 2025,
    location: "Alexandria, Suez & Cairo",
    typology: "Apartment",
    stage: "Design stage",
    brief: "Four bathrooms, four stones — each one set out before a single fitting was chosen.",
    statement: [
      "Bathrooms are where an interior either holds together or falls apart, because they have the most joints per square metre. On each of these the stone was set out first, and the fittings were chosen to suit the pattern.",
      "A book-matched onyx runs through a walk-in shower in one; black Marquina and backlit profiles carry another; a pink onyx wall makes a girls' bathroom feel grown-up without being cold.",
    ],
    materials: ["Onyx", "Nero Marquina", "Pink onyx", "Walnut vanity", "Gunmetal brassware"],
    facts: [
      { label: "Rooms", value: "Four" },
      { label: "Scope", value: "Interior design" },
      { label: "Stage", value: "Visualised" },
      { label: "Sector", value: "Residential" },
    ],
    cover: img("client/marble-bath-01.jpg", "A walk-in shower and vanity wrapped in veined onyx with a walnut screen"),
    gallery: [
      img("client/marble-bath-02.jpg", "The onyx shower seen through glass, with a lit niche and walnut panelling", "Onyx & walnut"),
      img("client/nero-bath.jpg", "A black marble bathroom with backlit vertical profiles", "Nero Marquina"),
      img("client/onyx-bath.jpg", "A girls' bathroom in pink onyx with a round mirror and a bathtub", "Pink onyx"),
    ],
    featured: false,
    order: 10,
  },
  {
    slug: "kitchens",
    title: "Kitchens",
    reference: "IC-25-009",
    year: 2025,
    location: "Alexandria",
    typology: "Apartment",
    stage: "Design stage",
    brief: "Two kitchens that work hard and still look like furniture.",
    statement: [
      "A galley kitchen lives or dies by its lighting and its handles. This one has neither in view: continuous LED lines under every cabinet and in the plinth, and push-to-open fronts in a dark timber that repeats in the vanity beyond.",
      "The second is a U-plan in grey lacquer and quartz, with full-height storage, a glazed plate rack and an extraction hood that sits flush with the upper units.",
    ],
    materials: ["Walnut veneer", "Grey lacquer", "Calacatta quartz", "Linear LED", "Black brassware"],
    facts: [
      { label: "Kitchens", value: "Two" },
      { label: "Scope", value: "Interior design" },
      { label: "Stage", value: "Visualised" },
      { label: "Sector", value: "Residential" },
    ],
    cover: img("client/galley-kitchen.jpg", "A galley kitchen in dark timber with continuous LED lines under the cabinets"),
    gallery: [
      img("client/grey-kitchen-01.jpg", "A U-shaped kitchen in grey lacquer with quartz worktops", "Grey kitchen"),
      img("client/grey-kitchen-02.jpg", "The grey kitchen's sink wall with a glazed plate rack above", "Sink wall"),
      img("client/galley-vanity.jpg", "A floating vanity with an organic mirror beside the kitchen", "Beyond the kitchen"),
    ],
    featured: false,
    order: 11,
  },
];

/* ---- /inside — rooms of the house ----------------------------------------
 * `id` matches a room in src/lib/house.ts. The walkthrough shows each room's
 * note and photograph when the camera reaches it. Rooms whose photograph has
 * an evening render switch with the lamp, just like the 3D lights do.
 * ------------------------------------------------------------------------ */

export const SEED_THRESHOLDS: Threshold[] = [
  {
    id: "foyer",
    room: "Entrance hall",
    ceiling: "+3.40",
    note: "A round marble inlay under a ring light marks the threshold. The first thing you see is straight ahead: a sculpture at the end of the gallery axis.",
    media: img("stock/entrance-13.jpg", "A marble staircase lit from beneath each tread"),
    plan: { x: 50, y: 84 },
  },
  {
    id: "reception",
    room: "Reception",
    ceiling: "+3.40",
    note: "Two sofas face each other across a travertine table, and the whole room is lit from a stepped gypsum ceiling and one chandelier.",
    media: img("stock/living-09.jpg", "A formal reception with a crystal chandelier and ivory sofas"),
    plan: { x: 20, y: 78 },
  },
  {
    id: "living",
    room: "Family living",
    ceiling: "+3.20",
    note: "The television wall is one long run of timber panels. By evening the cove takes over and the room is lit from its edges — try the lamp.",
    media: img(
      "client/boho-living-day.jpg",
      "A family living room with a timber-panelled wall and a bouclé armchair",
      undefined,
      { night: "client/boho-living-night.jpg" },
    ),
    plan: { x: 80, y: 78 },
  },
  {
    id: "dining",
    room: "Dining & kitchen",
    ceiling: "+3.20",
    note: "No wall between cooking and eating — the ceiling steps down over the island instead, so the two zones read apart while the floor runs through.",
    media: img("stock/kitchen-04.jpg", "A black kitchen with a marble splashback and a dining table under a globe chandelier"),
    plan: { x: 80, y: 30 },
  },
  {
    id: "study",
    room: "Study",
    ceiling: "+3.00",
    note: "Joinery on three walls, a desk under the window, and a reading chair with its own lamp. The quietest room in the house.",
    media: img("stock/library-20.jpg", "A study panelled in dark timber with a long desk"),
    plan: { x: 50, y: 16 },
  },
  {
    id: "master",
    room: "Master bedroom",
    ceiling: "+3.00",
    note: "An upholstered headboard wall runs the full width of the room and hides the reading lights. Nothing hangs over the bed.",
    media: img("stock/bedroom-09.jpg", "A bedroom with an arched, backlit headboard wall"),
    plan: { x: 20, y: 38 },
  },
  {
    id: "bath",
    room: "Master bath",
    ceiling: "+2.80",
    note: "A backlit mirror and a pendant carry the room after dark; everything else is off. Switch the lamp to see it.",
    media: img(
      "client/guest-bath-mirror-day.jpg",
      "A ribbed glass basin beneath a backlit arched mirror with petal pendants",
      undefined,
      { night: "client/guest-bath-mirror-night.jpg" },
    ),
    plan: { x: 20, y: 10 },
  },
];

/* ---- /monograph — the bound volume --------------------------------------- */

export const SEED_SPREADS: Spread[] = [
  {
    id: "sp-01",
    folio: 8,
    kicker: "Residential · Alexandria",
    title: "Modern Boho Residence",
    body: "A timber-panelled family room rendered twice — once by daylight and once after dark — and a terrazzo guest bath that carries the same warmth.",
    media: img("client/boho-living-day.jpg", "The family living room in daylight"),
    mediaB: img("client/terrazzo-bath-mirror.jpg", "The terrazzo-framed arched mirror"),
    projectSlug: "modern-boho-residence",
  },
  {
    id: "sp-02",
    folio: 16,
    kicker: "Villa · New Cairo",
    title: "Villa Obsidian",
    body: "Smoked oak, black marble and bronze, lit from inside the joinery so the ceilings stay empty and the house is calm at night.",
    media: img("stock/moody-01.jpg", "A sofa before a backlit slatted wall"),
    mediaB: img("stock/kitchen-14.jpg", "The black marble kitchen island"),
    projectSlug: "villa-obsidian",
  },
  {
    id: "sp-03",
    folio: 24,
    kicker: "Workplace · New Cairo",
    title: "Atelier Headquarters",
    body: "Offices that feel closer to a members' club: a stone reception, timber lounges, and glass instead of partitions so daylight reaches the middle of the plan.",
    media: img("stock/office-03.jpg", "The executive office"),
    mediaB: img("stock/office-24.jpg", "The reception desk"),
    projectSlug: "atelier-headquarters",
  },
  {
    id: "sp-04",
    folio: 32,
    kicker: "Restaurant · Zamalek",
    title: "Maison Noir",
    body: "No general light in the dining room at all — every table has its own pool, the bar glows from beneath and the walls are washed from the floor.",
    media: img("stock/hospitality-07.jpg", "The lounge bar"),
    mediaB: img("stock/hospitality-06.jpg", "Copper pendants over the booths"),
    projectSlug: "maison-noir",
  },
  {
    id: "sp-05",
    folio: 40,
    kicker: "Hotel · New Capital",
    title: "The Grand Reception",
    body: "One sweeping curve of walnut draws guests past still water to the desk, and the ceiling drops over the lounge so the hall becomes a room.",
    media: img("stock/lobby-09.jpg", "The curved timber lobby"),
    mediaB: img("stock/lobby-13.jpg", "The atrium pool"),
    projectSlug: "the-grand-reception",
  },
  {
    id: "sp-06",
    folio: 48,
    kicker: "Healthcare · Sheikh Zayed",
    title: "Serenity Clinic & Spa",
    body: "Daylight and plaster for the clinic, timber and water for the spa below — and every finish chosen to be both calm and easy to keep clean.",
    media: img("stock/wellness-12.jpg", "The spa pool"),
    mediaB: img("stock/wellness-21.jpg", "The clinic reception"),
    projectSlug: "serenity-clinic-and-spa",
  },
  {
    id: "sp-07",
    folio: 56,
    kicker: "Residential · Cairo",
    title: "Warm Minimal Guest Bath",
    body: "One glass basin, one backlit mirror and a porcelain pendant like a flower. After dark, those two lights are the whole room.",
    media: img("client/guest-bath-mirror-day.jpg", "The glass basin and backlit mirror"),
    mediaB: img("client/guest-bath-wide.jpg", "The guest bathroom"),
    projectSlug: "warm-minimal-guest-bath",
  },
];

/* ---- Reviews ------------------------------------------------------------
 * Real recommendations left on the studio's Facebook page. English reviews are
 * verbatim. Arabic reviews are shown as written, with an English rendering
 * underneath — translating somebody's words and showing only the translation
 * would be putting words in their mouth.
 * ---------------------------------------------------------------------- */

export const SEED_TESTIMONIALS: Testimonial[] = [
  {
    id: "t-ahmed-ayman",
    lang: "en",
    quote:
      "Thanks so much for all of your efforts, guidance & help in making our HOME from A to Z, you've a keen eye for detail, you've turned bricks into a truly wonderful home from the planning phase to the design and execution phase of the project.",
    author: "Ahmed Ayman",
    role: "Private residence",
    source: "Facebook recommendation",
  },
  {
    id: "t-randa-farouk",
    lang: "en",
    quote:
      "Very talented and professional! Even in my absence I was out of the country. We discussed all details online and the end result was beyond expectations. Highly recommended.",
    author: "Randa Farouk",
    role: "Private residence",
    source: "Facebook recommendation",
    date: "14 August",
  },
  {
    id: "t-moustafa-shaaban",
    lang: "ar",
    quote:
      "من افضل الشركات اللي تعاملت معاها. شغل ممتاز وتسليم في الميعاد. ربنا يبارك فيك مهندس احمد فوزي",
    translation:
      "One of the best firms I have dealt with. Excellent work, handed over on time. God bless you, Eng. Ahmed Fawzy.",
    author: "Moustafa Shaaban",
    role: "Private residence",
    source: "Facebook recommendation",
    date: "23 August 2023",
  },
  {
    id: "t-dina-elshaikh",
    lang: "ar",
    quote:
      "شكرا يا بشمهندس على زوقك الراقى وطولة بالك وصبرك مع اى حد عشان توصل لاحسن نتيجة. ربنا يوفقك ويرزقك الخير يارب",
    translation:
      "Thank you for your refined taste, your patience, and for bearing with anyone so the result comes out the best it can. May God grant you success and provide you with good.",
    author: "Dina Elshaikh",
    role: "Private residence",
    source: "Facebook recommendation",
    date: "30 July",
  },
  {
    id: "t-mahmoud-ahmed",
    lang: "ar",
    quote:
      "ماشاء الله يا هندسة فعلا والله مجهود كبير جدا وتصميم وتنفيذ علي أعلي مستوي من الإبداع. ربنا يوفقك دايما ومن نجاح لنجاح",
    translation:
      "Genuinely a very great effort — design and execution at the highest level of creativity. May God always grant you success, from one success to the next.",
    author: "Mahmoud Ahmed",
    role: "Private residence",
    source: "Facebook comment",
  },
];
