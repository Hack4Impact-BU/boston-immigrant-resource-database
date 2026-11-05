import { formatCount } from "@/lib/format-count";

type AdminResultCountProps = {
  /** How many rows are showing, after the search and the filters. */
  shown: number;
  /** How many rows there are altogether. */
  total: number;
};

// "Showing 1,234 of 12,345", for the Admin tool tables, in the same words and size as the count on Search Services (but one shade darker: it
// is on the gray page background here, not on a white card, and slate-500 is only 4.35:1 against that, under the 4.5:1 text needs). The
// numbers have thousands separators, like the total in each page's header. As a status message it is read out when it changes
// (WCAG 4.1.3), so a person using a screen reader hears what a search or a filter did.
export function AdminResultCount({ shown, total }: AdminResultCountProps) {
  return (
    <p role="status" className="ml-auto shrink-0 self-center whitespace-nowrap text-sm text-slate-600">
      Showing {formatCount(shown)} of {formatCount(total)}
    </p>
  );
}
