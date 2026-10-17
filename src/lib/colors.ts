/**
 * Picks dark or white text for a background given as "rgb(r, g, b)", which is how the Airtable option colors from
 * getTableSchema() come. It is the same rule the Search Services page uses for its status pills, so a status reads the
 * same everywhere. A color it can't read (such as a hex fallback) gets the dark text.
 */
export function getReadableTextColor(rgbString: string): string {
  const match = rgbString.match(/(\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return "#1e293b";
  const [, r, g, b] = match.map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#1e293b" : "#ffffff";
}
