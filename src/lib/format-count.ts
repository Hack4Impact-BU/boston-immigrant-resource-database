/**
 * A whole number written with thousands separators: 1234 becomes "1,234". The locale is fixed (en-US) rather than the browser's own,
 * because a page that is rendered on the server and then in the browser has to write a number the same way in both places, and a
 * browser set to German, say, would write "1.234" and make React report a mismatch.
 */
export function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}
