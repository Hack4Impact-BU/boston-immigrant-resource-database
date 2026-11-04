type AdminResultCountProps = {
  /** How many rows are showing, after the search and the filters. */
  shown: number;
  /** How many rows there are altogether. */
  total: number;
};

// "Showing 12 of 87", for the Admin tool tables, in the same words and size as the count on Search Services (but one shade darker: it is
// on the gray page background here, not on a white card, and slate-500 is only 4.35:1 against that, under the 4.5:1 text needs). The
// numbers are plain, like the counts in the page headers and on Search Services (no thousands separator, so "1234" there and here).
// As a status message it is read out when it changes (WCAG 4.1.3), so a person using a screen reader hears what a search or a filter did.
export function AdminResultCount({ shown, total }: AdminResultCountProps) {
  return (
    <p role="status" className="ml-auto shrink-0 self-center whitespace-nowrap text-sm text-slate-600">
      Showing {shown} of {total}
    </p>
  );
}
