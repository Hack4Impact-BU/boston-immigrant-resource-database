/**
 * A provider's service types arrive as one comma-joined string ("Legal Aid, Housing Assistance").
 * This returns the individual names, trimmed, with any empty pieces dropped. The filters and the
 * map's pop-up pills both use it, so they always agree on what a provider's service types are.
 */
export function splitServiceTypes(value: string): string[] {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}
