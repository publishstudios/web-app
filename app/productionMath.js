// Central Manufacturing Mathematics & Industry Presets for Print Production

export const TRIM_PRESETS = {
  '5x8': { id: '5x8', width: 5.0, height: 8.0, label: '5" × 8" (Compact Fiction / Pocket)' },
  '5.25x8': { id: '5.25x8', width: 5.25, height: 8.0, label: '5.25" × 8" (Standard Digest)' },
  '5.5x8.5': { id: '5.5x8.5', width: 5.5, height: 8.5, label: '5.5" × 8.5" (Trade Paperback / Memoir)' },
  '6x9': { id: '6x9', width: 6.0, height: 9.0, label: '6" × 9" (Standard Trade Paperback)' },
  '7x10': { id: '7x10', width: 7.0, height: 10.0, label: '7" × 10" (Textbook / Journal)' },
  '8x10': { id: '8x10', width: 8.0, height: 10.0, label: '8" × 10" (Art / Photography / Workbook)' },
  '8.5x8.5': { id: '8.5x8.5', width: 8.5, height: 8.5, label: '8.5" × 8.5" (Square / Illustrated / Picture)' },
  '8.5x11': { id: '8.5x11', width: 8.5, height: 11.0, label: '8.5" × 11" (Workbook / Manual / Document)' },
};

export const PAPER_SPECS = {
  white: {
    id: 'white',
    label: 'Standard White (50–55 lb / 74–81 gsm)',
    multiplier: 0.002252,
    description: 'Crisp finish, ideal for non-fiction, workbooks, planners, and crisp contrast.',
  },
  cream: {
    id: 'cream',
    label: 'Standard Cream (50–55 lb / 74–81 gsm)',
    multiplier: 0.0025,
    description: 'Warm, low-glare tone favored for literature, narrative fiction, and memoirs.',
  },
  color_standard: {
    id: 'color_standard',
    label: 'Standard Color (60 lb / 90 gsm)',
    multiplier: 0.002347,
    description: 'Standard opacity for charts, interior color highlights, and basic illustrations.',
  },
  color_premium: {
    id: 'color_premium',
    label: 'Premium Color (70 lb / 105 gsm)',
    multiplier: 0.0026,
    description: 'Heavyweight archival base for photo books, art prints, and high-saturation color.',
  },
};

// "What are you creating?" — Archetype Intent Matrix
export const BOOK_ARCHETYPES = {
  novel: {
    id: 'novel',
    title: 'Fiction & Novel',
    subtitle: 'Narrative prose, literature & story arcs',
    defaultTrim: '5.5x8.5',
    defaultPaper: 'cream',
    defaultBleed: false,
    defaultPages: 220,
    margins: { top: 0.625, bottom: 0.625, outside: 0.50 },
    guidance: 'Fiction benefits from comfortable outside margins and warm cream paper for reader immersion.',
  },
  nonfiction: {
    id: 'nonfiction',
    title: 'Non-Fiction & Memoir',
    subtitle: 'Business, biography, history & self-development',
    defaultTrim: '6x9',
    defaultPaper: 'white',
    defaultBleed: false,
    defaultPages: 180,
    margins: { top: 0.625, bottom: 0.625, outside: 0.50 },
    guidance: 'Standard 6" × 9" trade dimensions provide professional authority and balanced text density.',
  },
  workbook: {
    id: 'workbook',
    title: 'Workbook & Training Manual',
    subtitle: 'Exercises, study guides & reference materials',
    defaultTrim: '8.5x11',
    defaultPaper: 'white',
    defaultBleed: false,
    defaultPages: 110,
    margins: { top: 0.75, bottom: 0.75, outside: 0.625 },
    guidance: 'Generous margins provide comfortable room for written reader notes and flat reading.',
  },
  planner: {
    id: 'planner',
    title: 'Planner & Agenda',
    subtitle: 'Dated or undated goal tracking & productivity calendars',
    defaultTrim: '6x9',
    defaultPaper: 'white',
    defaultBleed: true,
    defaultPages: 90,
    margins: { top: 0.50, bottom: 0.50, outside: 0.375 },
    guidance: 'Bleed lock ensures tracking grids and edge line elements print seamlessly right to the trimmed edge.',
  },
  journal: {
    id: 'journal',
    title: 'Journal & Guided Log',
    subtitle: 'Reflective prompts, blank lined or dot-grid interiors',
    defaultTrim: '6x9',
    defaultPaper: 'cream',
    defaultBleed: false,
    defaultPages: 120,
    margins: { top: 0.50, bottom: 0.50, outside: 0.375 },
    guidance: 'Balanced margins keep writing lines centered and pleasant across open two-page spreads.',
  },
  children: {
    id: 'children',
    title: "Children's & Picture Book",
    subtitle: 'Illustrated spreads, early readers & visual stories',
    defaultTrim: '8.5x8.5',
    defaultPaper: 'color_premium',
    defaultBleed: true,
    defaultPages: 32,
    margins: { top: 0.375, bottom: 0.375, outside: 0.375 },
    guidance: 'Full bleed allows large illustrations to extend to the physical page borders without white borders.',
  },
  custom: {
    id: 'custom',
    title: 'Custom Specification',
    subtitle: 'Manual control over all production parameters',
    defaultTrim: '6x9',
    defaultPaper: 'white',
    defaultBleed: false,
    defaultPages: 120,
    margins: { top: 0.50, bottom: 0.50, outside: 0.375 },
    guidance: 'Directly calibrate trim, margins, paper weight, and gutter specifications.',
  },
};

// Plain-Language Educational Dictionary
export const FIELD_EXPLANATIONS = {
  trim: {
    term: 'Trim Size',
    definition: 'The final physical dimensions of the book after all edges are mechanically cut.',
    why: 'Determines the bookshelf presence, reader ergonomics, and standard printing press compatibility.',
  },
  gutter: {
    term: 'Spine Gutter Margin',
    definition: 'Extra inner margin added exclusively to the bound edge of each page.',
    why: 'Prevents text and graphics from disappearing or curling into the glued or stitched book spine.',
  },
  bleed: {
    term: 'Print Bleed (0.125")',
    definition: 'An extra 1/8-inch perimeter added beyond the final cut line on all outer edges.',
    why: 'Ensures that background colors, images, or full-spread artwork extend cleanly to the border without unintentional white paper slivers caused by normal mechanical blade variance.',
  },
  spine: {
    term: 'Spine Width',
    definition: 'The thickness of the book backbone, calculated strictly from page count and paper caliper.',
    why: 'Accurate spine width ensures the front and back cover designs fold cleanly over the spine edges.',
  },
  safeArea: {
    term: 'Safe Area',
    definition: 'The internal boundary (minimum 0.25" inward from trim, 0.0625" from spine folds).',
    why: 'Guarantees that essential text, page numbers, and barcodes will never be accidentally cut off or trapped in the fold during physical manufacturing.',
  },
  dpi: {
    term: 'Target DPI (Resolution)',
    definition: 'Dots Per Inch — the density of physical ink droplets placed per linear inch.',
    why: '300 DPI is the universal benchmark for crisp, continuous-tone commercial print reproduction.',
  },
};

// Mathematical Production Calculations
export function calculateGutterMargin(pageCount) {
  if (pageCount <= 150) return 0.375;
  if (pageCount <= 300) return 0.500;
  if (pageCount <= 500) return 0.625;
  if (pageCount <= 700) return 0.750;
  return 0.875;
}

export function calculateSpineWidth(pageCount, paperType = 'cream') {
  const paper = PAPER_SPECS[paperType] || PAPER_SPECS.cream;
  const rawSpine = pageCount * paper.multiplier;
  return Number(rawSpine.toFixed(3));
}

export function calculateFullWrapDimensions({
  trimWidth,
  trimHeight,
  pageCount,
  paperType = 'cream',
  bleed = 0.125,
}) {
  const spineWidth = calculateSpineWidth(pageCount, paperType);
  
  // Full-wrap width = (Back cover) + (Spine) + (Front cover) + (2 × Outer Bleed)
  const fullWidth = Number(((trimWidth * 2) + spineWidth + (bleed * 2)).toFixed(3));
  
  // Full-wrap height = (Trim Height) + (2 × Top/Bottom Bleed)
  const fullHeight = Number((trimHeight + (bleed * 2)).toFixed(3));

  const pixelWidth300Dpi = Math.round(fullWidth * 300);
  const pixelHeight300Dpi = Math.round(fullHeight * 300);

  // Safe area guides
  const safeArea = {
    topBottom: 0.25,
    outside: 0.25,
    spineHinge: 0.0625,
  };

  return {
    spineWidth,
    fullWidth,
    fullHeight,
    pixelWidth300Dpi,
    pixelHeight300Dpi,
    safeArea,
    bleed,
  };
    }
      
