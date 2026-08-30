// Shared Albanian color-name -> hex mapping, used everywhere a product's
// color needs to render as an actual visual swatch instead of plain text.
// Previously duplicated only in ProductCard.jsx; centralized here so every
// place showing colors (buyer product page, product cards, the seller's
// own color picker) stays in sync instead of drifting if one copy gets
// updated and the others don't.
export const COLOR_MAP = {
  "e zeze": "#1A1916", "e bardhe": "#FFFFFF", "gri": "#9A9890",
  "kafe": "#8B4513", "e kuqe": "#E53E3E", "blu": "#3182CE",
  "e gjelber": "#38A169", "verdhe": "#D69E2E", "portokalli": "#DD6B20",
  "rozë": "#ED64A6", "vjollce": "#805AD5", "ari": "#B7791F", "argjend": "#A0AEC0",
};

// Falls back to a neutral gray for a seller-typed custom color name that
// isn't in the preset list -- there's no way to know the real hex for
// arbitrary free text, so this is the honest "we don't know" swatch
// rather than guessing wrong.
export function colorToHex(name) {
  return COLOR_MAP[String(name || "").toLowerCase().trim()] || "#9A9890";
}
