// Self-contained high-quality SVG data URIs for each art category ensuring 100% reliable rendering without external CDN/network dependencies

export const CATEGORY_IMAGE_PRESETS: Record<string, string> = {
  'Original Paintings & Artworks':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23F5EFEB"/><rect x="60" y="50" width="480" height="320" rx="12" fill="%23FAF7F2" stroke="%23C85A32" stroke-width="6"/><circle cx="200" cy="180" r="45" fill="%23E09F3E"/><path d="M120 310 L220 200 L320 280 L400 220 L500 310 Z" fill="%23C85A32" opacity="0.6"/><circle cx="420" cy="130" r="25" fill="%23335C67"/><text x="300" y="410" font-family="serif" font-size="16" font-weight="bold" fill="%232C2825" text-anchor="middle">Original Painting & Artwork</text></svg>',

  'Fine Art & Prints':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23FAF7F2"/><rect x="80" y="45" width="440" height="330" fill="%23FFFFFF" stroke="%23D6C9B6" stroke-width="12"/><rect x="110" y="75" width="380" height="270" fill="%231D2D44"/><path d="M110 270 Q 200 180, 290 240 T 490 200 L 490 345 L 110 345 Z" fill="%23E09F3E" opacity="0.7"/><text x="300" y="415" font-family="serif" font-size="16" font-weight="bold" fill="%232C2825" text-anchor="middle">Fine Art & Limited Print</text></svg>',

  'Paints and Colours':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23F5EFEB"/><rect x="150" y="100" width="80" height="240" rx="15" fill="%23C85A32"/><rect x="160" y="70" width="60" height="40" rx="5" fill="%23D4AF37"/><rect x="260" y="120" width="80" height="220" rx="15" fill="%232980B9"/><rect x="270" y="90" width="60" height="40" rx="5" fill="%23D4AF37"/><rect x="370" y="100" width="80" height="240" rx="15" fill="%2327AE60"/><rect x="380" y="70" width="60" height="40" rx="5" fill="%23D4AF37"/><text x="300" y="405" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Artist Paints & Colours Set</text></svg>',

  'Brushes and Painting Tools':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23FAF7F2"/><rect x="280" y="60" width="40" height="260" rx="10" fill="%238B5A2B"/><rect x="275" y="300" width="50" height="40" fill="%23D4AF37"/><path d="M 275 340 Q 300 390, 325 340 Z" fill="%239E2A2B"/><rect x="180" y="90" width="30" height="220" rx="8" fill="%234A2E18" transform="rotate(-25 195 200)"/><rect x="390" y="90" width="30" height="220" rx="8" fill="%23D4B483" transform="rotate(25 405 200)"/><text x="300" y="410" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Professional Brushes & Tools</text></svg>',

  'Canvas and Surfaces':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23F5EFEB"/><rect x="120" y="80" width="360" height="260" rx="8" fill="%23E8E2D7" stroke="%23C85A32" stroke-width="10"/><rect x="140" y="100" width="320" height="220" fill="%23FAF7F2"/><line x1="140" y1="100" x2="460" y2="320" stroke="%23E09F3E" stroke-width="2" opacity="0.3"/><line x1="460" y1="100" x2="140" y2="320" stroke="%232980B9" stroke-width="2" opacity="0.3"/><text x="300" y="395" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Stretched Cotton Canvas</text></svg>',

  'Sketchbooks and Paper':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23FAF7F2"/><path d="M160 100 C200 90, 300 90, 300 340 C300 340, 200 330, 160 340 Z" fill="%23E8E2D7" stroke="%23A34828" stroke-width="4"/><path d="M300 100 C340 90, 440 90, 440 340 C440 340, 340 330, 300 340 Z" fill="%23FAF7F2" stroke="%23A34828" stroke-width="4"/><line x1="300" y1="100" x2="300" y2="340" stroke="%234A3E3D" stroke-width="6"/><text x="300" y="405" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Spiral Art Sketchbook</text></svg>',

  'Drawing and Sketching Tools':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23F5EFEB"/><rect x="180" y="180" width="240" height="35" rx="5" fill="%23E09F3E" transform="rotate(-15 300 200)"/><polygon points="160,225 180,185 180,225" fill="%234A3E3D" transform="rotate(-15 300 200)"/><rect x="200" y="240" width="240" height="35" rx="5" fill="%23C85A32" transform="rotate(10 320 260)"/><polygon points="440,200 420,240 420,200" fill="%232C2825" transform="rotate(10 320 260)"/><text x="300" y="405" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Graphite & Sketching Pencils</text></svg>',

  'Craft Supplies':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23FAF7F2"/><circle cx="300" cy="200" r="90" fill="%23E09F3E" opacity="0.3"/><rect x="220" y="140" width="160" height="120" rx="10" fill="%232980B9" opacity="0.8"/><circle cx="300" cy="200" r="40" fill="%23FAF7F2"/><text x="300" y="380" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Craft & Mixed Media Supplies</text></svg>',

  'Other Art Materials':
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23F5EFEB"/><ellipse cx="300" cy="210" rx="140" ry="100" fill="%238B5A2B"/><circle cx="230" cy="180" r="22" fill="%23C85A32"/><circle cx="290" cy="150" r="20" fill="%232980B9"/><circle cx="350" cy="180" r="24" fill="%2327AE60"/><circle cx="330" cy="250" r="20" fill="%23E09F3E"/><text x="300" y="375" font-family="serif" font-size="18" font-weight="bold" fill="%232C2825" text-anchor="middle">Studio Art Materials & Palette</text></svg>',
};

export const DEFAULT_ART_IMAGE = CATEGORY_IMAGE_PRESETS['Original Paintings & Artworks'];

export function getCategoryFallbackImage(category?: string): string {
  if (!category) return DEFAULT_ART_IMAGE;
  return CATEGORY_IMAGE_PRESETS[category] || DEFAULT_ART_IMAGE;
}

export function handleImageFallback(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string
): void {
  const target = event.currentTarget;
  const fallback = getCategoryFallbackImage(category);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
